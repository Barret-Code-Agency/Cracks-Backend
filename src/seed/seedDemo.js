import mongoose from 'mongoose'
import connectMongoDB from '../config/mongodb.js'
import authService from '../services/auth.service.js'
import userRepository from '../repositories/user.repository.js'
import contactRepository from '../repositories/contact.repository.js'
import contactService from '../services/contact.service.js'
import conversationService from '../services/conversation.service.js'
import messageRepository from '../repositories/message.repository.js'

// ── Cuentas de la entrega (editá emails / passwords si querés otros) ──
const FERNANDO = { email: 'fhdelgado.utn@gmail.com', password: 'Cracks2026!', display_name: 'Fernando Delgado' }
const PROFE = { email: 'cracks.tp.utn@gmail.com', password: 'Cracks2026!', display_name: 'Profesor' }

// Crea el usuario si no existe (reusa el registro real → auto-seed de los 50 cracks)
// y se asegura de que quede con el email verificado. Idempotente.
async function ensureUser({ email, password, display_name }) {
    let user = await userRepository.getByEmail(email)
    if (!user) {
        const result = await authService.register({ email, password, display_name })
        user = result.user
        console.log(`  + creado: ${email}`)
    } else {
        console.log(`  = ya existia: ${email}`)
    }
    if (!user.email_verificado) {
        user = await userRepository.updateById(user._id, { email_verificado: true })
    }
    return user
}

async function ensureContact(owner, contact) {
    const existing = await contactRepository.findByOwnerAndContact(owner._id, contact._id)
    if (!existing) {
        await contactService.addContact(owner._id, contact._id)
    }
}

await connectMongoDB()

const fer = await ensureUser(FERNANDO)
const profe = await ensureUser(PROFE)

// Contacto mutuo (cada uno ve al otro en su agenda)
await ensureContact(fer, profe)
await ensureContact(profe, fer)

// Conversacion de arranque con un mensaje, para que el chat ya aparezca al entrar
const conv = await conversationService.findOrCreatePrivate(fer._id, profe._id)
const existingMsgs = await messageRepository.listByConversation(conv._id)
if (existingMsgs.length === 0) {
    await conversationService.sendMessage(conv._id, fer._id, 'Hola profe! Bienvenido a Cracks. Escribame por aca cuando quiera. 👋')
}

console.log('\nDemo seed listo:')
console.log(`  Fernando : ${fer.email}  (verificado: ${fer.email_verificado})`)
console.log(`  Profe    : ${profe.email}  (verificado: ${profe.email_verificado})`)
console.log('  Contacto mutuo + conversacion de arranque OK.')

await mongoose.disconnect()
process.exit(0)
