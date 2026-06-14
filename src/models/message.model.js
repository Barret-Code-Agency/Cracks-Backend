import mongoose from 'mongoose'
import { USER_MODEL_NAME } from './user.model.js'
import { CONVERSATION_MODEL_NAME } from './conversation.model.js'
import { MESSAGE_CONTENT_TYPE } from '../constants/message.constant.js'

export const MESSAGE_MODEL_NAME = 'Message'

const messageSchema = new mongoose.Schema({
    conversation_id:     { type: mongoose.Schema.ObjectId, ref: CONVERSATION_MODEL_NAME, required: true },
    sender_user_id:      { type: mongoose.Schema.ObjectId, ref: USER_MODEL_NAME, required: true },
    content:             { type: String, required: true },
    content_type:        { type: String, enum: Object.values(MESSAGE_CONTENT_TYPE), default: MESSAGE_CONTENT_TYPE.TEXT },
    reply_to_message_id: { type: mongoose.Schema.ObjectId, ref: MESSAGE_MODEL_NAME, default: null },
    sent_at:             { type: Date, default: Date.now },
    edited_at:           { type: Date, default: null },
    deleted_at:          { type: Date, default: null }
})

// Consulta dominante: ultimos mensajes de una conversacion
messageSchema.index({ conversation_id: 1, sent_at: -1 })

const Message = mongoose.model(MESSAGE_MODEL_NAME, messageSchema)

export default Message
