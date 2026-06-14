import mongoose from 'mongoose'
import { USER_MODEL_NAME } from './user.model.js'

const contactSchema = new mongoose.Schema({
    owner_user_id:   { type: mongoose.Schema.ObjectId, ref: USER_MODEL_NAME, required: true },
    contact_user_id: { type: mongoose.Schema.ObjectId, ref: USER_MODEL_NAME, required: true },
    alias:           { type: String, default: null },
    is_blocked:      { type: Boolean, default: false },
    is_favorite:     { type: Boolean, default: false },
    created_at:      { type: Date, default: Date.now }
})

// Evita vinculos duplicados. Que un usuario no se agregue a si mismo se valida en el service.
contactSchema.index({ owner_user_id: 1, contact_user_id: 1 }, { unique: true })

export const CONTACT_MODEL_NAME = 'Contact'
const Contact = mongoose.model(CONTACT_MODEL_NAME, contactSchema)

export default Contact
