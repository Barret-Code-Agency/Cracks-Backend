import mongoose from 'mongoose'
import connectMongoDB from '../config/mongodb.js'
import User from '../models/user.model.js'
import { CRACKS } from './cracks.data.js'

// Carga los 50 cracks como usuarios bot (es_bot) en la base.
// Es idempotente: se identifica por email, asi que correrlo de nuevo no duplica.
await connectMongoDB()

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

const total = await User.countDocuments({ es_bot: true })
console.log(`Seed de cracks listo: ${creados} creados, ${actualizados} actualizados.`)
console.log(`Total de cracks (es_bot) en la base: ${total}`)

await mongoose.disconnect()
