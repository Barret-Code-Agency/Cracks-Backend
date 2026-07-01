import mongoose from 'mongoose'
import { USER_MODEL_NAME } from './user.model.js'
import { STATUS_TYPE } from '../constants/status.constant.js'

export const STATUS_MODEL_NAME = 'Status'

const statusSchema = new mongoose.Schema({
    user_id:    { type: mongoose.Schema.ObjectId, ref: USER_MODEL_NAME, required: true },
    content:    { type: String, required: true },
    content_type: { type: String, enum: Object.values(STATUS_TYPE), default: STATUS_TYPE.TEXT },
    background: { type: String, default: null }, // color de fondo para los estados de texto
    created_at: { type: Date, default: Date.now },
    expires_at: { type: Date, required: true }
})

// Indice TTL: MongoDB borra el documento automaticamente cuando expires_at < ahora.
// Asi el estado "vive" 24 h sin necesidad de un cron ni de limpieza manual.
statusSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 })
// Listar los estados de un usuario, del mas nuevo al mas viejo.
statusSchema.index({ user_id: 1, created_at: -1 })

const Status = mongoose.model(STATUS_MODEL_NAME, statusSchema)

export default Status
