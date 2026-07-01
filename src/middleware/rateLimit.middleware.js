import { rateLimit, ipKeyGenerator } from 'express-rate-limit'

// Identifica al que pide: por usuario autenticado si lo hay, y si no por IP
// (normalizada con el helper para que IPv6 no evada el limite).
const userOrIpKey = (request) => request.user?.user_id ?? ipKeyGenerator(request.ip)

// Desactiva los limites cuando corren los tests (todos comparten la misma IP y
// agotarian el cupo). En produccion NODE_ENV no es 'test', asi que no afecta.
const skipInTest = () => process.env.NODE_ENV === 'test'

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
    skip: skipInTest,
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
    skip: skipInTest,
    handler: buildHandler('Demasiados registros desde esta red. Intenta de nuevo en una hora.')
})

// Recuperacion de contraseña: evita el envio masivo de emails de reset.
// 5 pedidos por IP cada hora.
export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipInTest,
    handler: buildHandler('Demasiados pedidos de recuperacion. Intenta de nuevo en una hora.')
})

// Envio de mensajes: frena el flooding en las conversaciones.
// 30 mensajes por usuario cada minuto. Se cuenta por usuario autenticado
// (no por IP) para no penalizar a varios usuarios detras de la misma red.
export const messageLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipInTest,
    keyGenerator: userOrIpKey,
    handler: buildHandler('Estas enviando mensajes muy rapido. Espera unos segundos.')
})

// Respuestas del crack (IA): mas estricto porque cada llamada consume la API de Groq.
// 15 pedidos por usuario cada minuto.
export const botReplyLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 15,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipInTest,
    keyGenerator: userOrIpKey,
    handler: buildHandler('El crack necesita un respiro. Espera unos segundos antes de seguir.')
})
