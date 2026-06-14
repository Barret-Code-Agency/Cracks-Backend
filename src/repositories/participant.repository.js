import ConversationParticipant from '../models/conversationParticipant.model.js'

const USER_FIELDS = 'display_name avatar_url email es_bot status_message'

class ParticipantRepository {
    async create(conversation_id, user_id, role) {
        return await ConversationParticipant.create({ conversation_id, user_id, role })
    }

    async listActiveByUser(user_id) {
        return await ConversationParticipant.find({ user_id, left_at: null })
    }

    async findActive(conversation_id, user_id) {
        return await ConversationParticipant.findOne({ conversation_id, user_id, left_at: null })
    }

    async findActiveInConversations(user_id, conversation_ids) {
        return await ConversationParticipant.findOne({
            user_id,
            conversation_id: { $in: conversation_ids },
            left_at: null
        })
    }

    async listByConversation(conversation_id) {
        return await ConversationParticipant
            .find({ conversation_id, left_at: null })
            .populate('user_id', USER_FIELDS)
    }

    async softLeave(conversation_id, user_id) {
        return await ConversationParticipant.findOneAndUpdate(
            { conversation_id, user_id, left_at: null },
            { left_at: new Date() },
            { new: true }
        )
    }
}

const participantRepository = new ParticipantRepository()
export default participantRepository
