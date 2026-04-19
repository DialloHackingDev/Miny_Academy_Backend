/**
 * ✅ Configuration pour les tests
 * Utilise mongodb-memory-server pour une DB en mémoire
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// ✅ Démarrer le serveur MongoDB en mémoire
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // ✅ Vérifier si déjà connecté et nettoyer
    if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
    }
    
    // ✅ Connecter mongoose avec options
    await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    });
});

// ✅ Nettoyer après chaque test
afterEach(async () => {
    try {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            const collection = collections[key];
            await collection.deleteMany({});
        }
    } catch (error) {
        console.error('Erreur nettoyage collections:', error.message);
    }
});

// ✅ Arrêter le serveur après tous les tests
afterAll(async () => {
    try {
        if (mongoServer) {
            await mongoServer.stop();
        }
        await mongoose.connection.close();
    } catch (error) {
        console.error('Erreur fermeture connexion:', error.message);
    }
});

module.exports = {
    mongoServer
};
