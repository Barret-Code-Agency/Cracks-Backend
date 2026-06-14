class ServerError extends Error {
    constructor(message, status = 500) {
        super(message)
        this.status = status
        this.name = 'ServerError'
    }
}

export default ServerError
