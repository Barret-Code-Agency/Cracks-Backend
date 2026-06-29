import mongoose from 'mongoose'
import connectMongoDB from '../config/mongodb.js'
import User from '../models/user.model.js'
import userRepository from '../repositories/user.repository.js'
import conversationService from '../services/conversation.service.js'
import messageRepository from '../repositories/message.repository.js'
import { crackGreeting } from '../utils/crackGreeting.js'

// Backfill: asegura que TODOS los usuarios reales (no bots) tengan un chat
// abierto con cada crack, con un saludo inicial del crack.
// Es idempotente: si la conversacion ya tiene mensajes (ya existe el chat o el
// usuario ya charlo), no agrega nada. Correrlo de nuevo no duplica.
await connectMongoDB()

const bots = await userRepository.getBots()
const realUsers = await User
    .find({ es_bot: { $ne: true }, deleted_at: null })
    .select('_id display_name email')

console.log(`Usuarios reales: ${realUsers.length} - Cracks: ${bots.length}`)

let chatsNuevos = 0
let usuariosTocados = 0

for (const user of realUsers) {
    let creadosEsteUser = 0
    for (const bot of bots) {
        try {
            const conversation = await conversationService.findOrCreatePrivate(user._id, bot._id)
            const yaTieneMensajes = await messageRepository.existsForConversation(conversation._id)
            if (!yaTieneMensajes) {
                await conversationService.sendMessage(
                    conversation._id,
                    bot._id,
                    crackGreeting(bot.display_name)
                )
                chatsNuevos++
                creadosEsteUser++
            }
        } catch (error) {
            console.error(`  ! ${user.email} x ${bot.display_name}: ${error.message}`)
        }
    }
    if (creadosEsteUser > 0) usuariosTocados++
    console.log(`  ${user.email}: ${creadosEsteUser} chats nuevos`)
}

console.log(`\nBackfill listo: ${chatsNuevos} chats creados en ${usuariosTocados} usuarios.`)

await mongoose.disconnect()
process.exit(0)
