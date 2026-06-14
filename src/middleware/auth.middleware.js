import jwt from 'jsonwebtoken'
import ENVIRONMENT from '../config/environment.js'
import ServerError from '../utils/serverError.js'

const authMiddleware = (request, response, next) => {
    const authorization = request.headers.authorization

    if (!authorization || !authorization.startsWith('Bearer ')) {
        throw new ServerError('No autorizado: falta el token', 401)
    }

    const token = authorization.split(' ')[1]

    try {
        const payload = jwt.verify(token, ENVIRONMENT.JWT_SECRET)
        request.user = payload
        next()
    }
    catch (error) {
        throw new ServerError('Token invalido o expirado', 401)
    }
}

export default authMiddleware
