import mongoose from 'mongoose'
import ServerError from '../utils/serverError.js'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Minimo 8 caracteres, con al menos una letra y un numero
const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/

export const validateRegister = (request, response, next) => {
    const { email, password, display_name } = request.body

    if (!email || !EMAIL_REGEX.test(email)) {
        throw new ServerError('El email es invalido', 400)
    }
    if (!password || !PASSWORD_REGEX.test(password)) {
        throw new ServerError('La contraseña debe tener al menos 8 caracteres, con letras y números', 400)
    }
    if (!display_name || display_name.trim().length < 2) {
        throw new ServerError('El nombre debe tener al menos 2 caracteres', 400)
    }

    next()
}

export const validateLogin = (request, response, next) => {
    const { email, password } = request.body

    if (!email || !EMAIL_REGEX.test(email)) {
        throw new ServerError('El email es invalido', 400)
    }
    if (!password) {
        throw new ServerError('La contraseña es obligatoria', 400)
    }

    next()
}

// Valida que un parametro de ruta sea un ObjectId de MongoDB.
// Evita el 500 que tira Mongoose al castear ids con formato invalido:
// devuelve un 400 claro antes de tocar la base.
export const validateObjectId = (param) => (request, response, next) => {
    if (!mongoose.isValidObjectId(request.params[param])) {
        throw new ServerError('El identificador no es valido', 400)
    }

    next()
}

export const validateForgotPassword = (request, response, next) => {
    const { email } = request.body

    if (!email || !EMAIL_REGEX.test(email)) {
        throw new ServerError('El email es invalido', 400)
    }

    next()
}

export const validateResetPassword = (request, response, next) => {
    const { token, password } = request.body

    if (!token) {
        throw new ServerError('Falta el token de recuperacion', 400)
    }
    if (!password || !PASSWORD_REGEX.test(password)) {
        throw new ServerError('La contraseña debe tener al menos 8 caracteres, con letras y números', 400)
    }

    next()
}

export const validatePrivateConversation = (request, response, next) => {
    if (!request.body.user_id) {
        throw new ServerError('Falta el user_id del destinatario', 400)
    }

    next()
}

export const validateMessage = (request, response, next) => {
    const { content } = request.body

    if (!content || content.trim().length === 0) {
        throw new ServerError('El mensaje no puede estar vacio', 400)
    }

    next()
}

export const validateContact = (request, response, next) => {
    if (!request.body.contact_user_id) {
        throw new ServerError('Falta el contact_user_id', 400)
    }

    next()
}

export const validateGroup = (request, response, next) => {
    const { name } = request.body

    if (!name || name.trim().length < 2) {
        throw new ServerError('El nombre del grupo debe tener al menos 2 caracteres', 400)
    }

    next()
}

export const validateAddMember = (request, response, next) => {
    if (!request.body.user_id) {
        throw new ServerError('Falta el user_id del miembro', 400)
    }

    next()
}
