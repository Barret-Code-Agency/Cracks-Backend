import ServerError from '../utils/serverError.js'

const errorMiddleware = (error, request, response, next) => {
    if (error instanceof ServerError) {
        return response.status(error.status).json({
            ok: false,
            status: error.status,
            message: error.message
        })
    }

    console.error('Error no controlado:', error)
    return response.status(500).json({
        ok: false,
        status: 500,
        message: 'Error interno del servidor'
    })
}

export default errorMiddleware
