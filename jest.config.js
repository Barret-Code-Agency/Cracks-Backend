export default {
    testEnvironment: 'node',
    // Carga las variables de entorno de test antes de importar la app.
    setupFiles: ['<rootDir>/tests/setup-env.js'],
    // transform vacio: ejecutamos los tests como ESM nativo (sin Babel).
    transform: {},
    testMatch: ['**/tests/**/*.test.js'],
    testTimeout: 30000,
    // Cierra el proceso al terminar aunque mongoose deje algun handle colgando.
    forceExit: true
}
