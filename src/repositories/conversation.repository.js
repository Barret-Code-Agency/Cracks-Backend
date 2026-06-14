import Conversation from '../models/conversation.model.js'
import { CONVERSATION_TYPE } from '../constants/conversation.constant.js'

class ConversationRepository {
    async create(type) {
        return await Conversation.create({ type })
    }

    async getById(conversation_id) {
        return await Conversation.findOne({ _id: conversation_id, deleted_at: null })
    }

    async listByIds(conversation_ids) {
        return await Conversation
            .find({ _id: { $in: conversation_ids }, deleted_at: null })
            .sort({ updated_at: -1 })
    }

    async listPrivateByIds(conversation_ids) {
        return await Conversation.find({
            _id: { $in: conversation_ids },
            type: CONVERSATION_TYPE.PRIVATE,
            deleted_at: null
        })
    }

    async touch(conversation_id) {
        return await Conversation.findByIdAndUpdate(conversation_id, { updated_at: new Date() })
    }

    async softDelete(conversation_id) {
        return await Conversation.findByIdAndUpdate(conversation_id, { deleted_at: new Date() })
    }
}

const conversationRepository = new ConversationRepository()
export default conversationRepository
