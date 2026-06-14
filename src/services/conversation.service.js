import conversationRepository from '../repositories/conversation.repository.js'
import participantRepository from '../repositories/participant.repository.js'
import messageRepository from '../repositories/message.repository.js'
import userRepository from '../repositories/user.repository.js'
import ServerError from '../utils/serverError.js'
import { CONVERSATION_TYPE } from '../constants/conversation.constant.js'

class ConversationService {
    // Busca la conversacion privada existente entre dos usuarios, o la crea.
    async findOrCreatePrivate(my_user_id, other_user_id) {
        if (String(my_user_id) === String(other_user_id)) {
            throw new ServerError('No podes iniciar una conversacion con vos mismo', 400)
        }

        const other = await userRepository.getById(other_user_id)
        if (!other || other.deleted_at) {
            throw new ServerError('Usuario no encontrado', 404)
        }

        const myParticipations = await participantRepository.listActiveByUser(my_user_id)
        const privateConvs = await conversationRepository.listPrivateByIds(
            myParticipations.map(p => p.conversation_id)
        )
        const shared = await participantRepository.findActiveInConversations(
            other_user_id,
            privateConvs.map(c => c._id)
        )
        if (shared) {
            return await conversationRepository.getById(shared.conversation_id)
        }

        const conversation = await conversationRepository.create(CONVERSATION_TYPE.PRIVATE)
        await participantRepository.create(conversation._id, my_user_id)
        await participantRepository.create(conversation._id, other_user_id)
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

        return await message.populate('sender_user_id', 'display_name avatar_url es_bot')
    }

    // Persiste la respuesta de un crack (bot) en una conversacion privada.
    // Solo el participante humano puede dispararla, y debe existir un participante bot.
    async sendBotReply(conversation_id, requester_user_id, content) {
        await this.assertParticipant(conversation_id, requester_user_id)

        const participants = await participantRepository.listByConversation(conversation_id)
        const botParticipant = participants.find(
            (p) => String(p.user_id._id) !== String(requester_user_id) && p.user_id.es_bot
        )
        if (!botParticipant) {
            throw new ServerError('Esta conversacion no tiene un crack para responder', 400)
        }

        const message = await messageRepository.create({
            conversation_id,
            sender_user_id: botParticipant.user_id._id,
            content
        })

        await conversationRepository.touch(conversation_id)

        return await message.populate('sender_user_id', 'display_name avatar_url es_bot')
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

        const result = []
        for (const conversation of conversations) {
            const participants = await participantRepository.listByConversation(conversation._id)
            const last_message = await messageRepository.getLastByConversation(conversation._id)
            result.push({
                id: conversation._id,
                type: conversation.type,
                updated_at: conversation.updated_at,
                participants: participants.map(p => p.user_id),
                last_message
            })
        }
        return result
    }
}

const conversationService = new ConversationService()
export default conversationService
