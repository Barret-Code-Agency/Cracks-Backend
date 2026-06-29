import bcrypt from 'bcrypt'
import userRepository from '../repositories/user.repository.js'
import contactService from './contact.service.js'
import mailService from './mail.service.js'
import ServerError from '../utils/serverError.js'
import { signToken, verifyToken } from '../utils/jwt.util.js'

const BCRYPT_ROUNDS = 12

class AuthService {
    async register({ email, password, display_name, phone_number }) {
        const existing = await userRepository.getByEmail(email)
        if (existing) {
            throw new ServerError('El email ya esta registrado', 400)
        }

        const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS)

        const new_user = await userRepository.create({
            email,
            password_hash,
            display_name,
            phone_number: phone_number || null
        })

        // Auto-seed: el usuario nuevo arranca con los 50 cracks como contactos
        await contactService.seedCracksForUser(new_user._id)

        // Y queda conectado con el anfitrion (Fernando) para poder escribirle,
        // con un chat de bienvenida para no entrar a una bandeja vacia
        await contactService.seedHostContact(new_user._id, new_user.display_name)

        const verification_token = signToken({ user_id: new_user._id }, '1d')
        // Enviamos el email de verificacion SIN bloquear el registro: si el SMTP falla o tarda,
        // la cuenta igual queda creada y el registro responde al instante.
        mailService.sendVerificationEmail(new_user.email, verification_token)
            .catch((error) => console.error('No se pudo enviar el email de verificacion:', error.message))

        return { user: new_user, verification_token }
    }

    async verifyEmail(token) {
        let payload
        try {
            payload = verifyToken(token)
        }
        catch (error) {
            throw new ServerError('Token de verificacion invalido o expirado', 400)
        }

        const user = await userRepository.getById(payload.user_id)
        if (!user) {
            throw new ServerError('Usuario no encontrado', 404)
        }
        if (user.email_verificado) {
            return user
        }

        return await userRepository.updateById(user._id, { email_verificado: true })
    }

    async login({ email, password }) {
        const user = await userRepository.getByEmail(email)
        if (!user) {
            throw new ServerError('Credenciales invalidas', 401)
        }

        const password_ok = await bcrypt.compare(password, user.password_hash)
        if (!password_ok) {
            throw new ServerError('Credenciales invalidas', 401)
        }

        if (!user.email_verificado) {
            throw new ServerError('Debes verificar tu email antes de iniciar sesion', 403)
        }

        const access_token = signToken({ user_id: user._id })

        return { user, access_token }
    }
}

const authService = new AuthService()
export default authService
