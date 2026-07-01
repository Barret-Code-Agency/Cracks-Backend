import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals'
import request from 'supertest'
import app from '../src/app.js'
import User from '../src/models/user.model.js'
import { connectTestDB, clearTestDB, closeTestDB } from './helpers/db.js'

beforeAll(connectTestDB, 60000)
afterEach(clearTestDB)
afterAll(closeTestDB)

// Registra, verifica y loguea un usuario. Devuelve su token y su id públicos.
const makeUser = async (email) => {
    const user = { email, password: 'Password1', display_name: `Usuario ${email.split('@')[0]}` }
    await request(app).post('/api/auth/register').send(user)
    await User.updateOne({ email }, { email_verificado: true })
    const login = await request(app).post('/api/auth/login').send({ email, password: user.password })
    return { token: login.body.data.access_token, id: login.body.data.user.id }
}

const auth = (token) => ({ Authorization: `Bearer ${token}` })

// Abre la conversación privada A→B y devuelve su id.
const openConversation = async (a, b) => {
    const res = await request(app).post('/api/conversations/private').set(auth(a.token)).send({ user_id: b.id })
    return res.body.data.conversation._id
}

describe('Envío de mensajes', () => {
    it('un participante puede enviar un mensaje (201)', async () => {
        const [a, b] = [await makeUser('a@cracks.com'), await makeUser('b@cracks.com')]
        const conversationId = await openConversation(a, b)

        const res = await request(app)
            .post(`/api/conversations/${conversationId}/messages`)
            .set(auth(a.token))
            .send({ content: 'Hola B' })

        expect(res.status).toBe(201)
        expect(res.body.data.message.content).toBe('Hola B')
    })

    it('un tercero ajeno a la conversación no puede enviar (403)', async () => {
        const [a, b, c] = [await makeUser('a@cracks.com'), await makeUser('b@cracks.com'), await makeUser('c@cracks.com')]
        const conversationId = await openConversation(a, b)

        const res = await request(app)
            .post(`/api/conversations/${conversationId}/messages`)
            .set(auth(c.token))
            .send({ content: 'Me colé' })

        expect(res.status).toBe(403)
    })

    it('rechaza un mensaje vacío (400)', async () => {
        const [a, b] = [await makeUser('a@cracks.com'), await makeUser('b@cracks.com')]
        const conversationId = await openConversation(a, b)

        const res = await request(app)
            .post(`/api/conversations/${conversationId}/messages`)
            .set(auth(a.token))
            .send({ content: '   ' })

        expect(res.status).toBe(400)
    })

    it('sin token responde 401', async () => {
        const [a, b] = [await makeUser('a@cracks.com'), await makeUser('b@cracks.com')]
        const conversationId = await openConversation(a, b)

        const res = await request(app).get(`/api/conversations/${conversationId}/messages`)
        expect(res.status).toBe(401)
    })

    it('un id de conversación con formato inválido responde 400', async () => {
        const a = await makeUser('a@cracks.com')
        const res = await request(app).get('/api/conversations/no-es-un-id/messages').set(auth(a.token))
        expect(res.status).toBe(400)
    })
})

describe('Paginación de mensajes', () => {
    it('respeta el parámetro limit', async () => {
        const [a, b] = [await makeUser('a@cracks.com'), await makeUser('b@cracks.com')]
        const conversationId = await openConversation(a, b)

        for (const text of ['uno', 'dos', 'tres']) {
            await request(app).post(`/api/conversations/${conversationId}/messages`).set(auth(a.token)).send({ content: text })
        }

        const res = await request(app).get(`/api/conversations/${conversationId}/messages?limit=2`).set(auth(a.token))
        expect(res.status).toBe(200)
        expect(res.body.data.messages).toHaveLength(2)
    })
})

describe('Edición y borrado de mensajes', () => {
    const sendMessage = async (conversationId, sender, content) => {
        const res = await request(app).post(`/api/conversations/${conversationId}/messages`).set(auth(sender.token)).send({ content })
        return res.body.data.message._id
    }

    it('el autor puede editar su mensaje (200) y queda marcado como editado', async () => {
        const [a, b] = [await makeUser('a@cracks.com'), await makeUser('b@cracks.com')]
        const conversationId = await openConversation(a, b)
        const messageId = await sendMessage(conversationId, a, 'texto original')

        const res = await request(app)
            .patch(`/api/conversations/${conversationId}/messages/${messageId}`)
            .set(auth(a.token))
            .send({ content: 'texto editado' })

        expect(res.status).toBe(200)
        expect(res.body.data.message.content).toBe('texto editado')
        expect(res.body.data.message.edited_at).not.toBeNull()
    })

    it('un participante que no es el autor no puede editar (403)', async () => {
        const [a, b] = [await makeUser('a@cracks.com'), await makeUser('b@cracks.com')]
        const conversationId = await openConversation(a, b)
        const messageId = await sendMessage(conversationId, a, 'mensaje de A')

        const res = await request(app)
            .patch(`/api/conversations/${conversationId}/messages/${messageId}`)
            .set(auth(b.token))
            .send({ content: 'me lo apropio' })

        expect(res.status).toBe(403)
    })

    it('el autor puede borrar su mensaje y deja de listarse', async () => {
        const [a, b] = [await makeUser('a@cracks.com'), await makeUser('b@cracks.com')]
        const conversationId = await openConversation(a, b)
        const messageId = await sendMessage(conversationId, a, 'a borrar')

        const del = await request(app).delete(`/api/conversations/${conversationId}/messages/${messageId}`).set(auth(a.token))
        expect(del.status).toBe(200)

        const list = await request(app).get(`/api/conversations/${conversationId}/messages`).set(auth(a.token))
        expect(list.body.data.messages).toHaveLength(0)
    })
})
