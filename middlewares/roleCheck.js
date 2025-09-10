// Middleware pour vérifier le rôle de l'utilisateur

function roleCheck(requiredRole){
    return function (req, res, next) {
        // req.user doit être défini par le middleware d'authentification
        if (!req.user || !req.user.role) {
            console.log("pour req.user",req.user)
            console.log("pour req.user.role",req.user?.role)
            return res.status(401).json({ message: 'Utilisateur non authentifié.' });
        }
        // Si l'utilisateur est admin, il a tous les droits
        if (req.user.role === 'admin') {
            return next();
        }
        
        // Vérification du rôle
        if (req.user.role !== requiredRole) {
            console.log("####",req.user.role)
            return res.status(403).json({ message: 'Accès interdit. Rôle requis : ' + requiredRole });
        }
        next();
    };
}
module.exports = roleCheck;
