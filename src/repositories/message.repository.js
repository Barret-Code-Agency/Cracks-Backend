import Message from '../models/message.model.js'
import { SENDER_FIELDS } from '../constants/fields.constant.js'

const DEFAULT_MESSAGES_LIMIT = 50

class MessageRepository {
    async create(message_data) {
        return await Message.create(message_data)
    }

    // Trae los ultimos `limit` mensajes (usando el indice {conversation_id, sent_at})
    // y los devuelve en orden cronologico ascendente. Evita cargar conversaciones
    // enteras de miles de mensajes de una sola vez.
    async listByConversation(conversation_id, { limit = DEFAULT_MESSAGES_LIMIT } = {}) {
        const docs = await Message
            .find({ conversation_id, deleted_at: null })
            .sort({ sent_at: -1 })
            .limit(limit)
            .populate('sender_user_id', SENDER_FIELDS)
        return docs.reverse()
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
