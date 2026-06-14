import userRepository from '../repositories/user.repository.js'

// Escapa los caracteres especiales para usar el texto del usuario como regex de forma segura
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

class UserService {
    async search(query, current_user_id) {
        if (!query || query.trim().length < 2) {
            return []
        }
        return await userRepository.search(escapeRegex(query.trim()), current_user_id)
    }
}

const userService = new UserService()
export default userService
