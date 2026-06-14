import userService from '../services/user.service.js'

class UserController {
    async search(request, response) {
        const query = request.query.q || request.query.email
        const users = await userService.search(query, request.user.user_id)
        return response.status(200).json({
            ok: true,
            status: 200,
            message: 'Busqueda de usuarios',
            data: { users }
        })
    }
}

const userController = new UserController()
export default userController
