const mongoose = require("../config/db")

//la creation du schema user
const userSchema = mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    role:{
        type:String,
        emun:["admin","eleve","prof",{default:"eleve"}],
        required:true
    },
})

module.exports = mongoose.model("User",userSchema);