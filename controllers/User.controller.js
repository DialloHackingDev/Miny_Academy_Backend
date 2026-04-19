require("dotenv").config()
const Users = require("../models/Users.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const JWT_SECRET = process.env.JWT_SECRET || process.env.jwt_Secrety

// ✅ Validation des emails (RFC 5322 simplifié)
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// ✅ Validation de la force du password
// Minimum: 8 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial
const validatePassword = (password) => {
    if (password.length < 8) {
        return { valid: false, message: "Le mot de passe doit contenir au minimum 8 caractères" };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: "Le mot de passe doit contenir au moins une lettre majuscule" };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: "Le mot de passe doit contenir au moins un chiffre" };
    }
    if (!/[!@#$%^&*]/.test(password)) {
        return { valid: false, message: "Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*)" };
    }
    return { valid: true };
};

// ✅ Sanitization basique des inputs
const sanitizeInput = (input) => {
    return input.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

//la fonction pour enregistrer un utilisateur
exports.UserRegister = async (req,res,next) =>{
    try{
        let {username,email,password,role} = req.body
        
        // ✅ Validation des champs requis
        if(!username || !email || !password ) {
            return res.status(400).json({
                success: false,
                msg: "Tous les champs sont requis (username, email, password)"
            })
        }

        // ✅ Sanitization
        username = sanitizeInput(username);
        email = email.toLowerCase().trim();

        // ✅ Validation de l'email
        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                msg: "Adresse email invalide"
            })
        }

        // ✅ Validation de la force du password
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                success: false,
                msg: passwordValidation.message
            })
        }

        // ✅ Vérifier si l'email existe déjà
        const existingUser = await Users.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                msg: "Cet email est déjà utilisé"
            })
        }

        // ✅ Hash du password avec bcryptjs (10 rounds)
        const salt = 10;
        const hash = await bcrypt.hash(password, salt);
        
        const newUser = new Users({
            username,
            email,
            password: hash,
            role: role && ['admin', 'prof', 'eleve'].includes(role) ? role : "eleve"
        })
        
        await newUser.save();
        
        // ✅ Ne pas retourner le password au client
        const userResponse = {
            _id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role
        };
        
        return res.status(201).json({
            success: true,
            msg: "Utilisateur créé avec succès",
            user: userResponse
        })

    }catch(e){
        // ✅ Ne pas exposer la stack trace au client
        console.error("Erreur registration:", e);
        res.status(500).json({
            success: false,
            msg: "Erreur lors de l'enregistrement. Veuillez réessayer."
        })
    }
}

//la fonction pour connecter un utilisateur
exports.UserLogin = async (req,res,next) =>{
    try{
        const {email,password} = req.body
        
        // ✅ Validation des champs requis
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                msg: "Email et mot de passe sont requis"
            })
        }

        // ✅ Sanitization de l'email
        const sanitizedEmail = email.toLowerCase().trim();

        const user = await Users.findOne({email: sanitizedEmail})
        if(!user) {
            return res.status(401).json({
                success: false,
                msg: "Email ou mot de passe incorrect"  // ✅ Messages génériques pour sécurité
            })
        }
        
        //la verification du password
        const verified = await bcrypt.compare(password, user.password)
        if(!verified) {
            return res.status(401).json({
                success: false,
                msg: "Email ou mot de passe incorrect"  // ✅ Messages génériques pour sécurité
            })
        }

        //la creation du token
        const token = jwt.sign(
            {id: user._id, role: user.role},
            JWT_SECRET,
            {expiresIn: "12h"}
        );

        // ✅ Cookies SÉCURISÉS
        res.cookie('token', token, {
            httpOnly: true,   // ✅ Non accessible via JavaScript (XSS protection)
            secure: process.env.NODE_ENV === 'production',  // ✅ HTTPS only en production
            sameSite: 'Strict',  // ✅ CSRF protection
            maxAge: 12 * 60 * 60 * 1000  // 12 heures
        });

        console.log("✅ User login successful:", user._id);
        
        return res.status(200).json({
            success: true,
            msg: "Vous êtes connecté!",
            token: token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        })

    }catch(e){
        console.error("Erreur login:", e);
        // ✅ Ne pas exposer la stack trace au client
        res.status(500).json({
            success: false,
            msg: "Erreur serveur lors de la connexion"
        })
    }
}

//la fonction pour voir le profil
exports.UserProfil = async (req,res,next)=>{
    try{
        const userId = req.user.id || req.user._id;
        const user = await Users.findById(userId).select("-password");
       
        if(!user) {
            return res.status(404).json({
                success: false,
                msg: "Utilisateur non trouvé"
            })
        }
        
        return res.status(200).json({
            success: true,
            user: user
        })

    }catch(e){
        console.error("Erreur profil:", e);
        // ✅ Ne pas exposer la stack trace au client
        res.status(500).json({
            success: false,
            msg: "Erreur lors de la récupération du profil"
        })
    }
}
// Mise à jour du profil
exports.UpdateProfile = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const { username, email, bio, jobTitle, notifications, darkMode } = req.body;

        const updateData = {};
        if (username) updateData.username = username.trim();
        if (email) updateData.email = email.toLowerCase().trim();
        if (bio !== undefined) updateData.bio = bio.trim();
        if (jobTitle !== undefined) updateData.jobTitle = jobTitle.trim();
        if (notifications !== undefined) updateData.notifications = notifications;
        if (darkMode !== undefined) updateData.darkMode = darkMode;

        // Si l'email est modifié, vérifier s'il est déjà pris
        if (email) {
            const existingUser = await Users.findOne({ email: updateData.email, _id: { $ne: userId } });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    msg: "Cet email est déjà utilisé par un autre compte"
                });
            }
        }

        const user = await Users.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                msg: "Utilisateur non trouvé"
            });
        }

        return res.status(200).json({
            success: true,
            msg: "Profil mis à jour avec succès",
            user: user
        });

    } catch (e) {
        console.error("Erreur mise à jour profil:", e);
        res.status(500).json({
            success: false,
            msg: "Erreur lors de la mise à jour du profil"
        });
    }
}
