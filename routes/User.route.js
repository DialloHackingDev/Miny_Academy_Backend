const userControllers = require("../controllers/User.controller")
const router = require("express").Router()
const auth = require("../middlewares/auth.middlewares")
console.log(typeof auth)


//la route pour l'enregistre un utilisateur
router.post("/register",userControllers.UserRegister)


//la route pour la connection de l'utilisateur
router.post("/login",userControllers.UserLogin)

//la route pour la connection de l'utilisateur
router.get("/profile",auth,userControllers.UserProfil)


module.exports = router;