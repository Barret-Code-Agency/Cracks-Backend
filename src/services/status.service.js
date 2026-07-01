import statusRepository from '../repositories/status.repository.js'
import ServerError from '../utils/serverError.js'
import { STATUS_TYPE } from '../constants/status.constant.js'

const STATUS_TTL_MS = 24 * 60 * 60 * 1000 // los estados viven 24 horas

class StatusService {
    async create(user_id, { content, content_type, background }) {
        const type = Object.values(STATUS_TYPE).includes(content_type) ? content_type : STATUS_TYPE.TEXT
        const now = new Date()
        return await statusRepository.create({
            user_id,
            content,
            content_type: type,
            background: background || null,
            created_at: now,
            expires_at: new Date(now.getTime() + STATUS_TTL_MS)
        })
    }

    async listActive() {
        return await statusRepository.listActive()
    }

    async deleteOwn(status_id, user_id) {
        const status = await statusRepository.getById(status_id)
        if (!status) {
            throw new ServerError('Estado no encontrado', 404)
        }
        if (String(status.user_id) !== String(user_id)) {
            throw new ServerError('Solo podes borrar tus propios estados', 403)
        }
        await statusRepository.deleteById(status_id)
        return status_id
    }
}

const statusService = new StatusService()
export default statusService
