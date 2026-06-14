import mongoose from 'mongoose'
import { USER_MODEL_NAME } from './user.model.js'
import { CONVERSATION_MODEL_NAME } from './conversation.model.js'
import { MESSAGE_MODEL_NAME } from './message.model.js'
import { PARTICIPANT_ROLE } from '../constants/participant.constant.js'

const conversationParticipantSchema = new mongoose.Schema({
    conversation_id:      { type: mongoose.Schema.ObjectId, ref: CONVERSATION_MODEL_NAME, required: true },
    user_id:              { type: mongoose.Schema.ObjectId, ref: USER_MODEL_NAME, required: true },
    role:                 { type: String, enum: Object.values(PARTICIPANT_ROLE), default: PARTICIPANT_ROLE.MEMBER },
    joined_at:            { type: Date, default: Date.now },
    left_at:              { type: Date, default: null },
    last_read_message_id: { type: mongoose.Schema.ObjectId, ref: MESSAGE_MODEL_NAME, default: null },
    is_muted:             { type: Boolean, default: false }
})

// Un usuario no puede figurar dos veces en la misma conversacion
conversationParticipantSchema.index({ conversation_id: 1, user_id: 1 }, { unique: true })

export const CONVERSATION_PARTICIPANT_MODEL_NAME = 'ConversationParticipant'
const ConversationParticipant = mongoose.model(CONVERSATION_PARTICIPANT_MODEL_NAME, conversationParticipantSchema)

export default ConversationParticipant
