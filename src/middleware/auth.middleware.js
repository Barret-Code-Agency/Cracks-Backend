import ServerError from '../utils/serverError.js'
import { verifyToken } from '../utils/jwt.util.js'

const authMiddleware = (request, response, next) => {
    const authorization = request.headers.authorization

    if (!authorization || !authorization.startsWith('Bearer ')) {
        throw new ServerError('No autorizado: falta el token', 401)
    }

    const token = authorization.split(' ')[1]

    try {
        request.user = verifyToken(token)
        next()
    }
    catch (error) {
        throw new ServerError('Token invalido o expirado', 401)
    }
}

export default authMiddleware
