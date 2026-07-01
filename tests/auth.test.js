import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals'
import request from 'supertest'
import app from '../src/app.js'
import User from '../src/models/user.model.js'
import { connectTestDB, clearTestDB, closeTestDB } from './helpers/db.js'

beforeAll(connectTestDB, 60000)
afterEach(clearTestDB)
afterAll(closeTestDB)

const VALID_USER = { email: 'test@cracks.com', password: 'Password1', display_name: 'Test User' }

const registerVerified = async (user = VALID_USER) => {
    await request(app).post('/api/auth/register').send(user)
    await User.updateOne({ email: user.email }, { email_verificado: true })
}

describe('POST /api/auth/register', () => {
    it('registra un usuario nuevo (201)', async () => {
        const res = await request(app).post('/api/auth/register').send(VALID_USER)
        expect(res.status).toBe(201)
        expect(res.body.ok).toBe(true)
        expect(res.body.data.user.email).toBe(VALID_USER.email)
    })

    it('nunca expone el password_hash', async () => {
        const res = await request(app).post('/api/auth/register').send(VALID_USER)
        expect(res.body.data.user.password_hash).toBeUndefined()
    })

    it('rechaza un email inválido (400)', async () => {
        const res = await request(app).post('/api/auth/register').send({ ...VALID_USER, email: 'no-es-email' })
        expect(res.status).toBe(400)
    })

    it('rechaza una contraseña débil (400)', async () => {
        const res = await request(app).post('/api/auth/register').send({ ...VALID_USER, password: 'corta' })
        expect(res.status).toBe(400)
    })

    it('rechaza un email duplicado (400)', async () => {
        await request(app).post('/api/auth/register').send(VALID_USER)
        const res = await request(app).post('/api/auth/register').send(VALID_USER)
        expect(res.status).toBe(400)
    })
})

describe('POST /api/auth/login', () => {
    it('rechaza credenciales incorrectas (401)', async () => {
        await registerVerified()
        const res = await request(app).post('/api/auth/login').send({ email: VALID_USER.email, password: 'WrongPass1' })
        expect(res.status).toBe(401)
    })

    it('rechaza el login si el email no está verificado (403)', async () => {
        await request(app).post('/api/auth/register').send(VALID_USER)
        const res = await request(app).post('/api/auth/login').send({ email: VALID_USER.email, password: VALID_USER.password })
        expect(res.status).toBe(403)
    })

    it('permite el login con email verificado y devuelve token (200)', async () => {
        await registerVerified()
        const res = await request(app).post('/api/auth/login').send({ email: VALID_USER.email, password: VALID_USER.password })
        expect(res.status).toBe(200)
        expect(res.body.data.access_token).toBeDefined()
    })
})

describe('Recuperación de contraseña', () => {
    const resetTokenFrom = (res) => new URL(res.body.data.reset_url).searchParams.get('token')

    it('forgot-password responde genérico y sin token si el email no existe (200)', async () => {
        const res = await request(app).post('/api/auth/forgot-password').send({ email: 'nadie@cracks.com' })
        expect(res.status).toBe(200)
        expect(res.body.data.reset_url).toBeUndefined()
    })

    it('flujo completo: forgot → reset → login con la nueva contraseña', async () => {
        await registerVerified()
        const forgot = await request(app).post('/api/auth/forgot-password').send({ email: VALID_USER.email })
        const token = resetTokenFrom(forgot)
        expect(token).toBeTruthy()

        const reset = await request(app).post('/api/auth/reset-password').send({ token, password: 'NuevaClave1' })
        expect(reset.status).toBe(200)

        const login = await request(app).post('/api/auth/login').send({ email: VALID_USER.email, password: 'NuevaClave1' })
        expect(login.status).toBe(200)
    })

    it('el token de reset es de un solo uso (segundo intento 400)', async () => {
        await registerVerified()
        const forgot = await request(app).post('/api/auth/forgot-password').send({ email: VALID_USER.email })
        const token = resetTokenFrom(forgot)

        await request(app).post('/api/auth/reset-password').send({ token, password: 'NuevaClave1' })
        const second = await request(app).post('/api/auth/reset-password').send({ token, password: 'OtraClave2' })
        expect(second.status).toBe(400)
    })

    it('rechaza un token de reset inventado (400)', async () => {
        const res = await request(app).post('/api/auth/reset-password').send({ token: 'token.falso.123', password: 'NuevaClave1' })
        expect(res.status).toBe(400)
    })
})
