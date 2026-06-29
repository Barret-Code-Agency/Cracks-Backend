import User from '../models/user.model.js'

const PUBLIC_FIELDS = 'display_name email avatar_url status_message es_bot'

class UserRepository {
    async getByEmail(email) {
        return await User.findOne({ email, deleted_at: null })
    }

    async getById(user_id) {
        return await User.findById(user_id)
    }

    async create(user_data) {
        return await User.create(user_data)
    }

    async updateById(user_id, update_data) {
        return await User.findByIdAndUpdate(user_id, update_data, { new: true })
    }

    async search(safe_query, exclude_user_id) {
        const regex = new RegExp(safe_query, 'i')
        return await User
            .find({
                _id: { $ne: exclude_user_id },
                deleted_at: null,
                $or: [{ email: regex }, { display_name: regex }]
            })
            .select(PUBLIC_FIELDS)
            .limit(10)
    }

    async getBots() {
        return await User.find({ es_bot: true, deleted_at: null })
    }

    // Trae en una sola consulta los usuarios activos cuyos ids esten en la lista
    async getActiveByIds(user_ids) {
        return await User.find({ _id: { $in: user_ids }, deleted_at: null })
    }
}

const userRepository = new UserRepository()
export default userRepository
