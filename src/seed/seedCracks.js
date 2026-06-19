import mongoose from 'mongoose'
import connectMongoDB from '../config/mongodb.js'
import User from '../models/user.model.js'
import Contact from '../models/contact.model.js'
import Conversation from '../models/conversation.model.js'
import ConversationParticipant from '../models/conversationParticipant.model.js'
import Message from '../models/message.model.js'
import { CRACKS } from './cracks.data.js'

// Sincroniza los cracks (usuarios bot) con la lista de cracks.data.js.
//  - Agrega o actualiza los que estan en la lista (upsert por email).
//  - Elimina los es_bot que ya NO estan en la lista, junto con todo lo que
//    depende de ellos (contactos, conversaciones privadas y mensajes), para
//    no dejar referencias colgadas.
// Es idempotente: correrlo de nuevo deja la base igual a la lista.
await connectMongoDB()

// 1) Upsert de los cracks de la lista
let creados = 0
let actualizados = 0

for (const crack of CRACKS) {
    const resultado = await User.updateOne(
        { email: crack.email },
        {
            $set: {
                display_name: crack.display_name,
                avatar_url: crack.avatar_url,
                status_message: crack.status_message,
                phone_number: crack.phone_number,
                es_bot: true,
                email_verificado: true
            }
        },
        { upsert: true }
    )

    if (resultado.upsertedCount > 0) {
        creados++
    } else {
        actualizados++
    }
}

// 2) Eliminar los bots que sobran (es_bot que ya no estan en la lista)
const emailsAMantener = CRACKS.map((crack) => crack.email)
const botsASacar = await User.find({ es_bot: true, email: { $nin: emailsAMantener } }).select('_id')
const idsASacar = botsASacar.map((bot) => bot._id)

let eliminados = 0

if (idsASacar.length > 0) {
    // 2a) Conversaciones privadas donde participa alguno de esos bots
    const participaciones = await ConversationParticipant
        .find({ user_id: { $in: idsASacar } })
        .select('conversation_id')
    const convIds = [...new Set(participaciones.map((p) => String(p.conversation_id)))]

    // 2b) Borrar mensajes, participantes y la conversacion de esos chats
    if (convIds.length > 0) {
        await Message.deleteMany({ conversation_id: { $in: convIds } })
        await ConversationParticipant.deleteMany({ conversation_id: { $in: convIds } })
        await Conversation.deleteMany({ _id: { $in: convIds } })
    }

    // 2c) Borrar los contactos que apuntan a esos bots (o que los tengan como dueno)
    await Contact.deleteMany({
        $or: [
            { contact_user_id: { $in: idsASacar } },
            { owner_user_id: { $in: idsASacar } }
        ]
    })

    // 2d) Borrar los usuarios bot sobrantes
    const resultado = await User.deleteMany({ _id: { $in: idsASacar } })
    eliminados = resultado.deletedCount
}

const total = await User.countDocuments({ es_bot: true })
console.log(`Seed de cracks: ${creados} creados, ${actualizados} actualizados, ${eliminados} eliminados.`)
console.log(`Total de cracks (es_bot) en la base: ${total}`)

await mongoose.disconnect()
