import userService from '../services/user.service.js'
import { toPublicUser } from '../mappers/user.mapper.js'

class UserController {
    async search(request, response) {
        const query = request.query.q || request.query.email
        const users = await userService.search(query, request.user.user_id)
        return response.status(200).json({
            ok: true,
            status: 200,
            message: 'Busqueda de usuarios',
            data: { users: users.map(toPublicUser) }
        })
    }

    async updateMe(request, response) {
        const user = await userService.updateProfile(request.user.user_id, request.body)
        return response.status(200).json({
            ok: true,
            status: 200,
            message: 'Perfil actualizado',
            data: { user: toPublicUser(user) }
        })
    }
}

const userController = new UserController()
export default userController
