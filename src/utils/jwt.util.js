import jwt from 'jsonwebtoken'
import ENVIRONMENT from '../config/environment.js'

export const signToken = (payload, expiresIn = ENVIRONMENT.JWT_EXPIRES_IN) => {
    return jwt.sign(payload, ENVIRONMENT.JWT_SECRET, { expiresIn })
}

export const verifyToken = (token) => {
    return jwt.verify(token, ENVIRONMENT.JWT_SECRET)
}
