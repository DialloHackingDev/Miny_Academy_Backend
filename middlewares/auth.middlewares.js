const jwt = require("jsonwebtoken");
const jwt_Secrety = "diallo21325684";

async function authenfication(req, res, next) {
    const Aheader = req.header("Authorization");

    if (!Aheader) {
        return res.status(401).json({ msg: "Authorization header manquant" });
    }

    const token = Aheader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ msg: "Token manquant" });
    }

    try {
        // Vérification du token
        const verified = jwt.verify(token, jwt_Secrety);

        // On stocke l'utilisateur vérifié dans req.user
        req.user = verified;
        console.log("===============",req.user)

        next();
    } catch (e) {
        console.log("Erreur JWT:", e);
        res.status(403).json({ msg: "Token invalide" ,e:e});
    }
}

module.exports = authenfication;
