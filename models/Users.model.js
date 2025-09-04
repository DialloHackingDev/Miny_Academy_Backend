const mongoose = require("../config/db");

// Création du schema user
const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["admin", "eleve", "prof"], // liste des rôles autorisés
    default: "eleve",                  // valeur par défaut
    required: true
  }
});

module.exports = mongoose.model("User", userSchema);
