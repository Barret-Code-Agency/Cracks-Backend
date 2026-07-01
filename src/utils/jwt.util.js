import jwt from 'jsonwebtoken'
import ENVIRONMENT from '../config/environment.js'

export const signToken = (payload, expiresIn = ENVIRONMENT.JWT_EXPIRES_IN, secret = ENVIRONMENT.JWT_SECRET) => {
    return jwt.sign(payload, secret, { expiresIn })
}

export const verifyToken = (token, secret = ENVIRONMENT.JWT_SECRET) => {
    return jwt.verify(token, secret)
}

// Lee el payload sin validar la firma. Solo para tokens de reset de contraseña:
// necesitamos el user_id para reconstruir el secreto (que depende del hash actual)
// antes de poder verificar la firma de verdad.
export const decodeToken = (token) => {
    return jwt.decode(token)
}
