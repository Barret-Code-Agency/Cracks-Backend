import { rateLimit } from 'express-rate-limit'

// Devuelve la respuesta de "demasiadas peticiones" con el mismo formato
// que el resto de la API ({ ok, status, message }) en vez del texto plano
// por defecto de express-rate-limit.
const buildHandler = (message) => (request, response, next, options) => {
    response.status(options.statusCode).json({
        ok: false,
        status: options.statusCode,
        message
    })
}

// Login: frena la fuerza bruta de contraseñas.
// 10 intentos fallidos por IP cada 15 minutos. Un login exitoso no consume cupo.
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: buildHandler('Demasiados intentos de inicio de sesion. Espera 15 minutos e intenta de nuevo.')
})

// Registro: evita la creacion masiva de cuentas y el spam de emails de verificacion.
// 5 registros por IP cada hora.
export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: buildHandler('Demasiados registros desde esta red. Intenta de nuevo en una hora.')
})
