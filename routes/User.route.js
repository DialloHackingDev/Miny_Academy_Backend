//la partie users
const userControllers = require("../controllers/User.controller")
const router = require("express").Router()
const { authenticateToken } = require("../middlewares/auth");

//la route pour l'enregistre un utilisateur
router.post("/register",userControllers.UserRegister)
//la route pour la connection de l'utilisateur
router.post("/login",userControllers.UserLogin)

//la route pour la connection de l'utilisateur
router.get("/profile", authenticateToken, userControllers.UserProfil)


module.exports = router;