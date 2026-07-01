import statusService from '../services/status.service.js'

class StatusController {
    async create(request, response) {
        const status = await statusService.create(request.user.user_id, request.body)
        return response.status(201).json({
            ok: true,
            status: 201,
            message: 'Estado publicado',
            data: { status }
        })
    }

    async list(request, response) {
        const statuses = await statusService.listActive()
        return response.status(200).json({
            ok: true,
            status: 200,
            message: 'Estados obtenidos',
            data: { statuses }
        })
    }

    async remove(request, response) {
        const status_id = await statusService.deleteOwn(request.params.status_id, request.user.user_id)
        return response.status(200).json({
            ok: true,
            status: 200,
            message: 'Estado eliminado',
            data: { status_id }
        })
    }
}

const statusController = new StatusController()
export default statusController
