const Users = require("../models/Users.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const jwt_Secrety = "diallo21325684"



//la fonction pour enregistrer un utilisateur
exports.UserRegister = async (req,res,next) =>{
    try{
        const {username,email,password,role} = req.body
        if(!username || !email || !password ) return res.status(401).json({msg:"tous champ sont requis!"})

        //le hash du password
        const salt = 10
        const hash = await bcrypt.hash(password,salt)
        const newUser = await Users.create({
            username,
            email,
            password:hash,
            role
        })
        newUser.save()
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
        if(!email) return res.status(401).json({msg:"👱‍♂️ n'est pas trouver!"})
        
        
        //la verification du password
        const verified = bcrypt.compare(password,user.password)
        if(!verified) return res.status(401).json({msg:"le password est incorrect!"})

        //la creation du token
        const token = jwt.sign(
            {userId:user._id,role:user.role},
            jwt_Secrety,
            {expiresIn:"12h"}
        );
        console.log(token)
        return res.status(201).json({msg:"vous etes connecter!",token:token})


    }catch(e){
        console.log(e)
        res.status(500).json({msg:"errure est :",e})
    }
}

//la fonction pour voir le profil
exports.UserProfil = async (req,res,next)=>{

    try{
        console.log("========",req.user)
        const user = await Users.findById(req.user.userId).select("-password");
       
       console.log(user)
        if(!user)return res.status(401).json({msg:"aucun utilisateur n'est trouvé!"})
        
        res.status(201).json(user)

    }catch(e){
        console.log("==",e)
        res.status(500).json(e)
    }
}