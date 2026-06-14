import mongoose from 'mongoose'
import { CONVERSATION_TYPE } from '../constants/conversation.constant.js'

const conversationSchema = new mongoose.Schema({
    type:       { type: String, enum: Object.values(CONVERSATION_TYPE), required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    deleted_at: { type: Date, default: null }
})

export const CONVERSATION_MODEL_NAME = 'Conversation'
const Conversation = mongoose.model(CONVERSATION_MODEL_NAME, conversationSchema)

export default Conversation
