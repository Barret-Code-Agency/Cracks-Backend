import groupService from '../services/group.service.js'

class GroupController {
    async create(request, response) {
        const result = await groupService.createGroup(request.user.user_id, request.body)
        return response.status(201).json({
            ok: true,
            status: 201,
            message: 'Grupo creado',
            data: result
        })
    }

    async list(request, response) {
        const groups = await groupService.listMyGroups(request.user.user_id)
        return response.status(200).json({
            ok: true,
            status: 200,
            message: 'Grupos obtenidos',
            data: { groups }
        })
    }

    async getById(request, response) {
        const result = await groupService.getGroup(request.user.user_id, request.params.group_id)
        return response.status(200).json({
            ok: true,
            status: 200,
            message: 'Grupo obtenido',
            data: result
        })
    }

    async update(request, response) {
        const group = await groupService.updateGroup(
            request.user.user_id,
            request.params.group_id,
            request.body
        )
        return response.status(200).json({
            ok: true,
            status: 200,
            message: 'Grupo actualizado',
            data: { group }
        })
    }

    async addMember(request, response) {
        const result = await groupService.addMember(
            request.user.user_id,
            request.params.group_id,
            request.body.user_id
        )
        return response.status(201).json({
            ok: true,
            status: 201,
            message: 'Miembro agregado',
            data: result
        })
    }

    async removeMember(request, response) {
        const result = await groupService.removeMember(
            request.user.user_id,
            request.params.group_id,
            request.params.user_id
        )
        return response.status(200).json({
            ok: true,
            status: 200,
            message: 'Miembro eliminado',
            data: result
        })
    }

    async remove(request, response) {
        await groupService.deleteGroup(request.user.user_id, request.params.group_id)
        return response.status(200).json({
            ok: true,
            status: 200,
            message: 'Grupo eliminado'
        })
    }
}

const groupController = new GroupController()
export default groupController
