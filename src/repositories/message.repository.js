import Message from '../models/message.model.js'
import { SENDER_FIELDS } from '../constants/fields.constant.js'

const DEFAULT_MESSAGES_LIMIT = 50
const MAX_MESSAGES_LIMIT = 100

// Normaliza el limit que llega por query: entero, positivo y con techo,
// para que nadie pueda pedir la conversacion entera de una sola vez.
const sanitizeLimit = (limit) => {
    const parsed = Number(limit)
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return DEFAULT_MESSAGES_LIMIT
    }
    return Math.min(Math.trunc(parsed), MAX_MESSAGES_LIMIT)
}

class MessageRepository {
    async create(message_data) {
        return await Message.create(message_data)
    }

    // Trae hasta `limit` mensajes (usando el indice {conversation_id, sent_at})
    // y los devuelve en orden cronologico ascendente. Con `before` (fecha) pagina
    // hacia atras: trae los anteriores a ese instante, para el "cargar mas antiguos".
    async listByConversation(conversation_id, { limit, before } = {}) {
        const filter = { conversation_id, deleted_at: null }

        if (before) {
            const beforeDate = new Date(before)
            if (!Number.isNaN(beforeDate.getTime())) {
                filter.sent_at = { $lt: beforeDate }
            }
        }

        const docs = await Message
            .find(filter)
            .sort({ sent_at: -1 })
            .limit(sanitizeLimit(limit))
            .populate('sender_user_id', SENDER_FIELDS)
        return docs.reverse()
    }

    async getById(message_id) {
        return await Message.findById(message_id)
    }

    // Edita el contenido y sella la marca de edicion.
    async updateContent(message_id, content) {
        return await Message
            .findByIdAndUpdate(
                message_id,
                { content, edited_at: new Date() },
                { new: true }
            )
            .populate('sender_user_id', SENDER_FIELDS)
    }

    // Borrado logico: marca deleted_at sin sacar el documento de la base.
    async softDelete(message_id) {
        return await Message.findByIdAndUpdate(
            message_id,
            { deleted_at: new Date() },
            { new: true }
        )
    }

    async existsForConversation(conversation_id) {
        return await Message.exists({ conversation_id, deleted_at: null })
    }

    async getLastByConversation(conversation_id) {
        return await Message
            .findOne({ conversation_id, deleted_at: null })
            .sort({ sent_at: -1 })
    }
}

const messageRepository = new MessageRepository()
export default messageRepository
