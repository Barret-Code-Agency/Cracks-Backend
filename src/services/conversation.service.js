import conversationRepository from '../repositories/conversation.repository.js'
import participantRepository from '../repositories/participant.repository.js'
import messageRepository from '../repositories/message.repository.js'
import userRepository from '../repositories/user.repository.js'
import contactRepository from '../repositories/contact.repository.js'
import aiService from './ai.service.js'
import ServerError from '../utils/serverError.js'
import { CONVERSATION_TYPE } from '../constants/conversation.constant.js'
import { SENDER_FIELDS } from '../constants/fields.constant.js'

class ConversationService {
    // Busca la conversacion privada activa entre dos usuarios (o null si no existe).
    async findPrivateBetween(my_user_id, other_user_id) {
        const myParticipations = await participantRepository.listActiveByUser(my_user_id)
        const privateConvs = await conversationRepository.listPrivateByIds(
            myParticipations.map(p => p.conversation_id)
        )
        const shared = await participantRepository.findActiveInConversations(
            other_user_id,
            privateConvs.map(c => c._id)
        )
        return shared ? await conversationRepository.getById(shared.conversation_id) : null
    }

    // Borra (soft-delete) la conversacion privada entre dos usuarios, si existe.
    // La usa el borrado de contactos para que, al eliminar a alguien, se vaya tambien el chat.
    async deletePrivateBetween(my_user_id, other_user_id) {
        const conversation = await this.findPrivateBetween(my_user_id, other_user_id)
        if (conversation) {
            await conversationRepository.softDelete(conversation._id)
        }
        return conversation
    }

    // Lanza si el destinatario tiene bloqueado a quien quiere escribirle.
    async assertNotBlocked(my_user_id, other_user_id) {
        const relation = await contactRepository.findByOwnerAndContact(other_user_id, my_user_id)
        if (relation?.is_blocked) {
            throw new ServerError('No podés enviarle mensajes a este usuario', 403)
        }
    }

    // Busca la conversacion privada existente entre dos usuarios, o la crea.
    async findOrCreatePrivate(my_user_id, other_user_id) {
        if (String(my_user_id) === String(other_user_id)) {
            throw new ServerError('No podes iniciar una conversacion con vos mismo', 400)
        }

        const other = await userRepository.getById(other_user_id)
        if (!other || other.deleted_at) {
            throw new ServerError('Usuario no encontrado', 404)
        }

        // Respeta el bloqueo: si el otro me bloqueó, no se abre el chat.
        await this.assertNotBlocked(my_user_id, other_user_id)

        const existing = await this.findPrivateBetween(my_user_id, other_user_id)
        if (existing) {
            return existing
        }

        const conversation = await conversationRepository.create(CONVERSATION_TYPE.PRIVATE)
        try {
            await participantRepository.create(conversation._id, my_user_id)
            await participantRepository.create(conversation._id, other_user_id)
        } catch (error) {
            // Rollback manual: si falla la creación de un participante, borramos la
            // conversación para no dejarla huérfana. No usamos transacción para que
            // funcione también con MongoDB standalone en desarrollo.
            await conversationRepository.softDelete(conversation._id)
            throw error
        }
        return conversation
    }

    // Verifica que el usuario sea participante activo de la conversacion.
    async assertParticipant(conversation_id, user_id) {
        const conversation = await conversationRepository.getById(conversation_id)
        if (!conversation) {
            throw new ServerError('Conversacion no encontrada', 404)
        }
        const participant = await participantRepository.findActive(conversation_id, user_id)
        if (!participant) {
            throw new ServerError('No formas parte de esta conversacion', 403)
        }
        return conversation
    }

    async sendMessage(conversation_id, sender_user_id, content) {
        await this.assertParticipant(conversation_id, sender_user_id)

        const message = await messageRepository.create({
            conversation_id,
            sender_user_id,
            content
        })

        // Actualiza updated_at para ordenar la lista de chats (desnormalizacion controlada del modelo)
        await conversationRepository.touch(conversation_id)

        return await message.populate('sender_user_id', SENDER_FIELDS)
    }

    // Genera (con IA, en el servidor) y persiste la respuesta de un crack en una conversacion privada.
    // Solo el participante humano puede dispararla, y debe existir un participante bot.
    async generateBotReply(conversation_id, requester_user_id, user_text) {
        await this.assertParticipant(conversation_id, requester_user_id)

        const participants = await participantRepository.listByConversation(conversation_id)
        const botParticipant = participants.find(
            (p) => String(p.user_id._id) !== String(requester_user_id) && p.user_id.es_bot
        )
        if (!botParticipant) {
            throw new ServerError('Esta conversacion no tiene un crack para responder', 400)
        }
        const human = participants.find(
            (p) => String(p.user_id._id) === String(requester_user_id)
        )

        const reply = await aiService.generateCrackReply({
            crack_name: botParticipant.user_id.display_name,
            crack_bio: botParticipant.user_id.status_message,
            user_name: human?.user_id.display_name || 'un amigo',
            user_text
        })

        const message = await messageRepository.create({
            conversation_id,
            sender_user_id: botParticipant.user_id._id,
            content: reply
        })

        await conversationRepository.touch(conversation_id)

        return await message.populate('sender_user_id', SENDER_FIELDS)
    }

    async getMessages(conversation_id, user_id) {
        await this.assertParticipant(conversation_id, user_id)
        return await messageRepository.listByConversation(conversation_id)
    }

    async listMyConversations(user_id) {
        const myParticipations = await participantRepository.listActiveByUser(user_id)
        const conversations = await conversationRepository.listByIds(
            myParticipations.map(p => p.conversation_id)
        )

        // Procesamos todas las conversaciones en paralelo (y dentro de cada una,
        // participantes y ultimo mensaje a la vez) en vez de una por una en serie:
        // evita el cuello de botella N+1 al armar la lista de chats.
        const result = await Promise.all(conversations.map(async (conversation) => {
            const [participants, last_message] = await Promise.all([
                participantRepository.listByConversation(conversation._id),
                messageRepository.getLastByConversation(conversation._id)
            ])
            return {
                id: conversation._id,
                type: conversation.type,
                updated_at: conversation.updated_at,
                participants: participants.map(p => p.user_id),
                last_message
            }
        }))
        return result
    }
}

const conversationService = new ConversationService()
export default conversationService
