import Message from '../models/message.model.js'

const SENDER_FIELDS = 'display_name avatar_url es_bot'

class MessageRepository {
    async create(message_data) {
        return await Message.create(message_data)
    }

    async listByConversation(conversation_id) {
        return await Message
            .find({ conversation_id, deleted_at: null })
            .sort({ sent_at: 1 })
            .populate('sender_user_id', SENDER_FIELDS)
    }

    async getLastByConversation(conversation_id) {
        return await Message
            .findOne({ conversation_id, deleted_at: null })
            .sort({ sent_at: -1 })
    }
}

const messageRepository = new MessageRepository()
export default messageRepository
