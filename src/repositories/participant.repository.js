import ConversationParticipant from '../models/conversationParticipant.model.js'
import { PARTICIPANT_USER_FIELDS } from '../constants/fields.constant.js'

class ParticipantRepository {
    async create(conversation_id, user_id, role) {
        return await ConversationParticipant.create({ conversation_id, user_id, role })
    }

    // Busca la membresia exista o no este activa (incluye a quienes ya salieron)
    async findAny(conversation_id, user_id) {
        return await ConversationParticipant.findOne({ conversation_id, user_id })
    }

    // Reactiva a un miembro que habia salido (left_at -> null) y le re-asigna rol
    async reactivate(conversation_id, user_id, role) {
        return await ConversationParticipant.findOneAndUpdate(
            { conversation_id, user_id },
            { left_at: null, role },
            { new: true }
        )
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
            .populate('user_id', PARTICIPANT_USER_FIELDS)
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
