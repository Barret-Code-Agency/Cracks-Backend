import Group from '../models/group.model.js'

const CREATOR_FIELDS = 'display_name avatar_url es_bot'

class GroupRepository {
    async create(group_data) {
        return await Group.create(group_data)
    }

    async getById(group_id) {
        return await Group.findById(group_id).populate('created_by_user_id', CREATOR_FIELDS)
    }

    async getByConversationId(conversation_id) {
        return await Group.findOne({ conversation_id })
    }

    async listByConversationIds(conversation_ids) {
        return await Group
            .find({ conversation_id: { $in: conversation_ids } })
            .sort({ created_at: -1 })
            .populate('created_by_user_id', CREATOR_FIELDS)
    }

    async updateById(group_id, update_data) {
        return await Group
            .findByIdAndUpdate(group_id, update_data, { new: true })
            .populate('created_by_user_id', CREATOR_FIELDS)
    }
}

const groupRepository = new GroupRepository()
export default groupRepository
