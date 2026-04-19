require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MB_url || "mongodb://admin:secretpassword@mongo:27017/academy?authSource=admin", {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log(`MongoDB connecté: ${conn.connection.host} ✅`);
    } catch (error) {
        console.error(`Erreur de connexion MongoDB: ${error.message} ❌`);
        // Retry connection after 5 seconds in Docker environment
        if (process.env.NODE_ENV === "development") {
            console.log("Nouvelle tentative de connexion dans 5 secondes...");
            setTimeout(connectDB, 5000);
        } else {
            process.exit(1);
        }
    }
};

// ✅ Ne pas connecter pendant les tests
if (process.env.NODE_ENV !== 'test') {
    connectDB();
}

module.exports = mongoose;