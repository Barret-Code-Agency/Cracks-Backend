import Status from '../models/status.model.js'
import { SENDER_FIELDS } from '../constants/fields.constant.js'

class StatusRepository {
    async create(status_data) {
        return await Status.create(status_data)
    }

    // Estados vigentes (no vencidos) de todos los usuarios, del mas nuevo al mas
    // viejo y con el autor poblado. Filtramos por expires_at ademas del TTL porque
    // el borrado del TTL corre en segundo plano y puede tener unos segundos de lag.
    async listActive() {
        return await Status
            .find({ expires_at: { $gt: new Date() } })
            .sort({ created_at: -1 })
            .populate('user_id', SENDER_FIELDS)
    }

    async getById(status_id) {
        return await Status.findById(status_id)
    }

    async deleteById(status_id) {
        return await Status.findByIdAndDelete(status_id)
    }
}

const statusRepository = new StatusRepository()
export default statusRepository
