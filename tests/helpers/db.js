import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

// Base de datos MongoDB en memoria (RAM) para los tests: real de verdad, pero
// efímera y aislada. Arranca antes de la suite y se borra al terminar.
let mongo

export const connectTestDB = async () => {
    mongo = await MongoMemoryServer.create()
    await mongoose.connect(mongo.getUri())
}

// Limpia todas las colecciones entre tests para que no se pisen entre sí.
export const clearTestDB = async () => {
    const collections = mongoose.connection.collections
    for (const key in collections) {
        await collections[key].deleteMany({})
    }
}

export const closeTestDB = async () => {
    await mongoose.connection.dropDatabase()
    await mongoose.connection.close()
    await mongo.stop()
}
