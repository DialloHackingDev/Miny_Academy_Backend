# 🚀 Fonctionnalités d'Upload de Fichiers - Backend Mini Academy

## 📋 Vue d'ensemble

Ce backend a été enrichi avec des fonctionnalités complètes pour gérer l'upload de fichiers PDF et vidéos lors de la création et modification de cours, ainsi que pour permettre aux étudiants de s'inscrire et télécharger les fichiers des cours.

## ✨ Nouvelles Fonctionnalités

### 📚 **Gestion des Types de Cours**
- **Cours Texte** : Contenu textuel classique
- **Cours PDF** : Upload et gestion de fichiers PDF
- **Cours Vidéo** : Upload de fichiers vidéo OU URL externe (YouTube, Vimeo)

### 📁 **Upload de Fichiers**
- Support des formats PDF (max 100MB)
- Support des formats vidéo : MP4, AVI, MOV, WMV, FLV, WEBM (max 100MB)
- Stockage organisé dans des dossiers séparés
- Noms de fichiers uniques avec timestamp
- Validation des types MIME

### 🔐 **Système d'Authentification**
- Middleware JWT pour l'authentification
- Vérification des rôles (professeur, étudiant, admin)
- Protection des routes sensibles
- Gestion des permissions par cours

### 📊 **Statistiques et Suivi**
- Compteur de téléchargements
- Compteur de vues
- Notes moyennes et nombre d'avis
- Statistiques par cours pour les professeurs

## 🛠️ **Structure Technique**

### **Modèles de Données**
```javascript
// Cours.model.js - Nouveaux champs
{
  courseType: 'text' | 'pdf' | 'video',
  pdfFile: {
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String
  },
  videoFile: { /* même structure que pdfFile */ },
  videoUrl: String, // Pour les vidéos externes
  stats: {
    totalViews: Number,
    totalDownloads: Number,
    averageRating: Number,
    totalReviews: Number
  }
}
```

### **Middlewares**
- `upload.js` : Gestion de l'upload avec Multer
- `auth.js` : Authentification et vérification des rôles

### **Contrôleurs**
- `cours.controller.js` : Logique métier complète
- Gestion des fichiers avec nettoyage automatique
- Validation des types de cours

## 🚀 **API Endpoints**

### **Création de Cours (Professeurs)**
```http
POST /api/course
Content-Type: multipart/form-data
Authorization: Bearer <token>

{
  "title": "Mon cours",
  "description": "Description du cours",
  "courseType": "pdf", // ou "text" ou "video"
  "price": 49.99,
  "content": "Contenu textuel (si courseType = 'text')",
  "pdfFile": <fichier PDF> (si courseType = 'pdf'),
  "videoFile": <fichier vidéo> (si courseType = 'video'),
  "videoUrl": "https://youtube.com/..." (si courseType = 'video' et pas de fichier)
}
```

### **Modification de Cours (Professeurs)**
```http
PUT /api/course/:id
Content-Type: multipart/form-data
Authorization: Bearer <token>

// Mêmes champs que la création
```

### **Inscription à un Cours (Étudiants)**
```http
POST /api/course/:id/enroll
Authorization: Bearer <token>
```

### **Téléchargement de Fichiers (Étudiants Inscrits)**
```http
GET /api/course/:id/download/:fileType
Authorization: Bearer <token>

// fileType peut être 'pdf' ou 'video'
```

### **Statistiques de Cours (Professeurs)**
```http
GET /api/course/:id/stats
Authorization: Bearer <token>
```

## 📁 **Structure des Dossiers**

```
BACKEND/
├── uploads/
│   ├── pdfs/          # Fichiers PDF uploadés
│   ├── videos/        # Fichiers vidéo uploadés
│   └── general/       # Autres fichiers
├── middlewares/
│   ├── upload.js      # Gestion des uploads
│   └── auth.js        # Authentification
├── models/
│   └── Cours.model.js # Modèle enrichi
├── controllers/
│   └── cours.controller.js # Contrôleur mis à jour
└── routes/
    └── Cours.route.js # Routes sécurisées
```

## 🔧 **Configuration**

### **Dépendances Requises**
```json
{
  "multer": "^2.0.2",        // Gestion des uploads
  "jsonwebtoken": "^9.0.2",  // Authentification JWT
  "express-validator": "^7.0.0" // Validation des données
}
```

### **Variables d'Environnement**
```env
JWT_SECRET=your-secret-key-here
PORT=3000
MONGODB_URI=mongodb://localhost:27017/mini-academy
```

## 🧪 **Tests et Validation**

### **Validation des Fichiers**
- Types MIME vérifiés
- Tailles maximales respectées
- Noms de fichiers sécurisés
- Nettoyage automatique en cas d'erreur

### **Sécurité**
- Authentification JWT obligatoire
- Vérification des rôles
- Protection contre l'accès non autorisé
- Validation des données d'entrée

## 📱 **Utilisation Frontend**

### **Création de Cours avec Fichiers**
```javascript
const formData = new FormData();
formData.append('title', 'Mon cours PDF');
formData.append('description', 'Description');
formData.append('courseType', 'pdf');
formData.append('price', '49.99');
formData.append('pdfFile', pdfFile);

await fetch('/api/course', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### **Inscription à un Cours**
```javascript
await fetch(`/api/course/${courseId}/enroll`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## 🚨 **Gestion des Erreurs**

### **Erreurs Communes**
- **400** : Données invalides ou fichiers manquants
- **401** : Token d'authentification manquant ou invalide
- **403** : Permissions insuffisantes
- **404** : Cours ou fichier non trouvé
- **500** : Erreur serveur

### **Nettoyage Automatique**
- Suppression des fichiers en cas d'erreur
- Gestion des roulebacks
- Logs d'erreur détaillés

## 🔮 **Évolutions Futures**

- **Streaming vidéo** pour les fichiers vidéo
- **Compression automatique** des fichiers
- **CDN** pour la distribution des fichiers
- **Chiffrement** des fichiers sensibles
- **Backup automatique** des fichiers
- **API de recherche** dans le contenu des PDFs

## 📚 **Documentation API Complète**

Pour une documentation complète de l'API, consultez le fichier `API_DOCUMENTATION.md` ou testez les endpoints avec Postman/Insomnia.

---

**🎉 Votre backend est maintenant prêt pour gérer les cours avec fichiers PDF et vidéos !**


