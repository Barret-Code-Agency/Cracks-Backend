import bcrypt from 'bcrypt'
import userRepository from '../repositories/user.repository.js'
import contactService from './contact.service.js'
import mailService from './mail.service.js'
import ServerError from '../utils/serverError.js'
import ENVIRONMENT from '../config/environment.js'
import { signToken, verifyToken, decodeToken } from '../utils/jwt.util.js'

const BCRYPT_ROUNDS = 12
const RESET_TOKEN_TTL = '30m'

// Secreto por-usuario para los tokens de recuperación: al incluir el hash de la
// contraseña actual, el token queda invalidado en cuanto la contraseña cambia.
// Efecto: el link de reset es de un solo uso, sin necesidad de guardar nada en la base.
const resetSecret = (user) => ENVIRONMENT.JWT_SECRET + user.password_hash

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

    // Paso 1 del reset: si el email existe, manda el correo con el link.
    // Responde SIEMPRE igual (el controller no distingue), para no revelar
    // qué emails están registrados (anti user-enumeration).
    async forgotPassword(email) {
        const user = await userRepository.getByEmail(email)
        if (!user) {
            return null
        }

        const reset_token = signToken(
            { user_id: user._id, purpose: 'reset' },
            RESET_TOKEN_TTL,
            resetSecret(user)
        )
        // No bloqueamos la respuesta esperando al proveedor de mail.
        mailService.sendPasswordResetEmail(user.email, reset_token)
            .catch((error) => console.error('No se pudo enviar el email de reset:', error.message))

        return reset_token
    }

    // Paso 2 del reset: valida el token y guarda la nueva contraseña.
    async resetPassword(token, new_password) {
        // Leemos el user_id sin verificar la firma, porque el secreto depende
        // del hash actual del usuario y necesitamos buscarlo primero.
        const decoded = decodeToken(token)
        const user = decoded?.user_id ? await userRepository.getById(decoded.user_id) : null
        if (!user) {
            throw new ServerError('El enlace de recuperacion no es valido', 400)
        }

        let payload
        try {
            payload = verifyToken(token, resetSecret(user))
        }
        catch (error) {
            throw new ServerError('El enlace de recuperacion no es valido o expiro', 400)
        }
        if (payload.purpose !== 'reset') {
            throw new ServerError('El enlace de recuperacion no es valido', 400)
        }

        const password_hash = await bcrypt.hash(new_password, BCRYPT_ROUNDS)
        // Al cambiar el hash, el secreto del token cambia: este mismo link ya no
        // sirve una segunda vez.
        await userRepository.updateById(user._id, { password_hash })

        return user
    }
}

const authService = new AuthService()
export default authService
