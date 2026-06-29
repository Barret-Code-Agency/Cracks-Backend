import userRepository from '../repositories/user.repository.js'
import ServerError from '../utils/serverError.js'

// Escapa los caracteres especiales para usar el texto del usuario como regex de forma segura
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Tope del avatar guardado como data URL base64 (~1.5 MB) para no inflar la base
const MAX_AVATAR_LENGTH = 1_500_000

class UserService {
    async search(query, current_user_id) {
        if (!query || query.trim().length < 2) {
            return []
        }
        return await userRepository.search(escapeRegex(query.trim()), current_user_id)
    }

    // Actualiza el perfil propio: nombre, estado y/o foto. Solo toca los campos enviados.
    async updateProfile(user_id, { display_name, status_message, avatar_url }) {
        const updates = {}

        if (display_name !== undefined) {
            const name = String(display_name).trim()
            if (name.length < 2) {
                throw new ServerError('El nombre debe tener al menos 2 caracteres', 400)
            }
            updates.display_name = name
        }

        if (status_message !== undefined) {
            updates.status_message = String(status_message).trim() || null
        }

        if (avatar_url !== undefined) {
            if (avatar_url && !/^(data:image\/|https?:\/\/)/.test(avatar_url)) {
                throw new ServerError('La foto debe ser una imagen valida', 400)
            }
            if (avatar_url && avatar_url.length > MAX_AVATAR_LENGTH) {
                throw new ServerError('La foto es demasiado grande, proba con una mas liviana', 400)
            }
            updates.avatar_url = avatar_url || null
        }

        updates.updated_at = new Date()
        const updated = await userRepository.updateById(user_id, updates)
        if (!updated) {
            throw new ServerError('Tu sesión expiró o la cuenta ya no existe. Volvé a iniciar sesión.', 404)
        }
        return updated
    }
}

const userService = new UserService()
export default userService
