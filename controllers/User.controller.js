require("dotenv").config()
const Users = require("../models/Users.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const jwt_Secrety = process.env.jwt_Secrety



//la fonction pour enregistrer un utilisateur
exports.UserRegister = async (req,res,next) =>{
    try{
        const {username,email,password,role} = req.body
        if(!username || !email || !password ) return res.status(401).json({msg:"tous champ sont requis!"})

        //le hash du password
        const salt = 10
        const hash = await bcrypt.hash(password,salt)
        const newUser = new Users({
            username,
            email,
            password:hash,
            role: role || "eleve" // Rôle par défaut : eleve
        })
        await newUser.save()
        return res.status(201).json(newUser)

    }catch(e){
        res.status(500).json(e)
    }
}

//la fonction pour connecter  un utilisateur
exports.UserLogin = async (req,res,next) =>{
    try{
        const {email,password} = req.body
        const user = await Users.findOne({email})
        if(!user) return res.status(401).json({msg:"Utilisateur non trouvé!"})
        
        
        //la verification du password
        const verified = await bcrypt.compare(password,user.password)
        if(!verified) return res.status(401).json({msg:"Mot de passe incorrect!"})

        //la creation du token
        const token = jwt.sign(
            {id:user._id,role:user.role},
            jwt_Secrety,
            {expiresIn:"12h"}
        );
        //comment peut creer les cookies

        res.cookie('token', token, {
        httpOnly: false,  // empêche l'accès via JS côté client
        secure: false,   // true si HTTPS
        maxAge: 24 * 60 * 60 * 1000 // durée en ms (ici 1 jour)
    });
        console.log(token)
         res.status(200).json({
            msg:"vous etes connecter!",
            token:token,
            user:{
                _id:user._id,
                username:user.username,
                email:user.email,
                role:user.role
            }
        })
        


    }catch(e){
        console.log("Erreur login backend:", e)
        res.status(500).json({msg:"Erreur serveur lors de la connexion", error: e.message})
    }
}

//la fonction pour voir le profil
exports.UserProfil = async (req,res,next)=>{

    try{
        console.log("========",req.user)
        const user = await Users.findById(req.user.id).select("-password");
       
       console.log(user)
        if(!user)return res.status(401).json({msg:"aucun utilisateur n'est trouvé!"})
        
        res.status(201).json(user)

    }catch(e){
        console.log("==",e)
        res.status(500).json(e)
    }
}