import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals'
import request from 'supertest'
import app from '../src/app.js'
import User from '../src/models/user.model.js'
import { connectTestDB, clearTestDB, closeTestDB } from './helpers/db.js'

beforeAll(connectTestDB, 60000)
afterEach(clearTestDB)
afterAll(closeTestDB)

const makeUser = async (email) => {
    const user = { email, password: 'Password1', display_name: `Usuario ${email.split('@')[0]}` }
    await request(app).post('/api/auth/register').send(user)
    await User.updateOne({ email }, { email_verificado: true })
    const login = await request(app).post('/api/auth/login').send({ email, password: user.password })
    return { token: login.body.data.access_token, id: login.body.data.user.id }
}

const auth = (token) => ({ Authorization: `Bearer ${token}` })

describe('Estados (status)', () => {
    it('publica un estado de texto (201) con vencimiento a 24 h', async () => {
        const a = await makeUser('a@cracks.com')
        const res = await request(app).post('/api/status').set(auth(a.token))
            .send({ content: 'Mi primer estado', content_type: 'text', background: '#00a884' })

        expect(res.status).toBe(201)
        expect(res.body.data.status.content).toBe('Mi primer estado')

        const created = new Date(res.body.data.status.created_at).getTime()
        const expires = new Date(res.body.data.status.expires_at).getTime()
        const horas = (expires - created) / (1000 * 60 * 60)
        expect(horas).toBeCloseTo(24, 1)
    })

    it('lista los estados vigentes con el autor poblado', async () => {
        const a = await makeUser('a@cracks.com')
        await request(app).post('/api/status').set(auth(a.token)).send({ content: 'Hola mundo' })

        const res = await request(app).get('/api/status').set(auth(a.token))
        expect(res.status).toBe(200)
        expect(res.body.data.statuses).toHaveLength(1)
        expect(res.body.data.statuses[0].user_id.display_name).toBeDefined()
    })

    it('rechaza un estado vacío (400)', async () => {
        const a = await makeUser('a@cracks.com')
        const res = await request(app).post('/api/status').set(auth(a.token)).send({ content: '   ' })
        expect(res.status).toBe(400)
    })

    it('sin token responde 401', async () => {
        const res = await request(app).get('/api/status')
        expect(res.status).toBe(401)
    })

    it('el autor puede borrar su estado y deja de listarse', async () => {
        const a = await makeUser('a@cracks.com')
        const created = await request(app).post('/api/status').set(auth(a.token)).send({ content: 'a borrar' })
        const id = created.body.data.status._id

        const del = await request(app).delete(`/api/status/${id}`).set(auth(a.token))
        expect(del.status).toBe(200)

        const list = await request(app).get('/api/status').set(auth(a.token))
        expect(list.body.data.statuses).toHaveLength(0)
    })

    it('no se puede borrar el estado de otro usuario (403)', async () => {
        const [a, b] = [await makeUser('a@cracks.com'), await makeUser('b@cracks.com')]
        const created = await request(app).post('/api/status').set(auth(a.token)).send({ content: 'de A' })
        const id = created.body.data.status._id

        const del = await request(app).delete(`/api/status/${id}`).set(auth(b.token))
        expect(del.status).toBe(403)
    })

    it('rechaza un id de estado con formato inválido (400)', async () => {
        const a = await makeUser('a@cracks.com')
        const res = await request(app).delete('/api/status/no-es-id').set(auth(a.token))
        expect(res.status).toBe(400)
    })
})
