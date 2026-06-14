import mongoose from 'mongoose'
import { USER_MODEL_NAME } from './user.model.js'
import { CONVERSATION_MODEL_NAME } from './conversation.model.js'

const groupSchema = new mongoose.Schema({
    conversation_id:    { type: mongoose.Schema.ObjectId, ref: CONVERSATION_MODEL_NAME, required: true, unique: true },
    name:               { type: String, required: true },
    description:        { type: String, default: null },
    avatar_url:         { type: String, default: null },
    created_by_user_id: { type: mongoose.Schema.ObjectId, ref: USER_MODEL_NAME, required: true },
    created_at:         { type: Date, default: Date.now }
})

export const GROUP_MODEL_NAME = 'Group'
const Group = mongoose.model(GROUP_MODEL_NAME, groupSchema)

export default Group
