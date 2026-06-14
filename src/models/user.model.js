import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    email:            { type: String, required: true, unique: true },
    password_hash:    { type: String, required: function () { return !this.es_bot } },
    display_name:     { type: String, required: true },
    phone_number:     { type: String, default: null },
    avatar_url:       { type: String, default: null },
    status_message:   { type: String, default: null },
    email_verificado: { type: Boolean, default: false },
    es_bot:           { type: Boolean, default: false },
    last_seen_at:     { type: Date, default: null },
    created_at:       { type: Date, default: Date.now },
    updated_at:       { type: Date, default: Date.now },
    deleted_at:       { type: Date, default: null }
})

userSchema.index({ phone_number: 1 }, { unique: true, partialFilterExpression: { phone_number: { $type: 'string' } } })

export const USER_MODEL_NAME = 'User'
const User = mongoose.model(USER_MODEL_NAME, userSchema)

export default User
