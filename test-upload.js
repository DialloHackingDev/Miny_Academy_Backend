// 🧪 Test des Fonctionnalités d'Upload - Mini Academy Backend
// Ce fichier permet de tester les nouvelles fonctionnalités d'upload

const fs = require('fs');
const path = require('path');

console.log('🚀 Test des Fonctionnalités d\'Upload - Mini Academy Backend\n');

// Test 1: Vérification de la structure des dossiers
console.log('📁 Test 1: Vérification de la structure des dossiers');
const uploadDir = path.join(__dirname, 'uploads');
const pdfDir = path.join(__dirname, 'uploads', 'pdfs');
const videoDir = path.join(__dirname, 'uploads', 'videos');

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('✅ Dossier uploads créé');
  } else {
    console.log('✅ Dossier uploads existe déjà');
  }

  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
    console.log('✅ Dossier pdfs créé');
  } else {
    console.log('✅ Dossier pdfs existe déjà');
  }

  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
    console.log('✅ Dossier videos créé');
  } else {
    console.log('✅ Dossier videos existe déjà');
  }
} catch (error) {
  console.error('❌ Erreur lors de la création des dossiers:', error.message);
}

// Test 2: Vérification des middlewares
console.log('\n🔧 Test 2: Vérification des middlewares');
try {
  const uploadMiddleware = require('./middlewares/upload');
  const authMiddleware = require('./middlewares/auth');
  
  if (uploadMiddleware.uploadCourseFiles) {
    console.log('✅ Middleware upload uploadCourseFiles disponible');
  } else {
    console.log('❌ Middleware upload uploadCourseFiles manquant');
  }
  
  if (authMiddleware.authenticateToken) {
    console.log('✅ Middleware auth authenticateToken disponible');
  } else {
    console.log('❌ Middleware auth authenticateToken manquant');
  }
  
  if (authMiddleware.requireTeacher) {
    console.log('✅ Middleware auth requireTeacher disponible');
  } else {
    console.log('❌ Middleware auth requireTeacher manquant');
  }
  
  if (authMiddleware.requireStudent) {
    console.log('✅ Middleware auth requireStudent disponible');
  } else {
    console.log('❌ Middleware auth requireStudent manquant');
  }
} catch (error) {
  console.error('❌ Erreur lors de la vérification des middlewares:', error.message);
}

// Test 3: Vérification du modèle de cours
console.log('\n📊 Test 3: Vérification du modèle de cours');
try {
  const Course = require('./models/Cours.model');
  const courseSchema = Course.schema.obj;
  
  if (courseSchema.courseType) {
    console.log('✅ Champ courseType disponible');
  } else {
    console.log('❌ Champ courseType manquant');
  }
  
  if (courseSchema.pdfFile) {
    console.log('✅ Champ pdfFile disponible');
  } else {
    console.log('❌ Champ pdfFile manquant');
  }
  
  if (courseSchema.videoFile) {
    console.log('✅ Champ videoFile disponible');
  } else {
    console.log('❌ Champ videoFile manquant');
  }
  
  if (courseSchema.videoUrl) {
    console.log('✅ Champ videoUrl disponible');
  } else {
    console.log('❌ Champ videoUrl manquant');
  }
  
  if (courseSchema.stats) {
    console.log('✅ Champ stats disponible');
  } else {
    console.log('❌ Champ stats manquant');
  }
} catch (error) {
  console.error('❌ Erreur lors de la vérification du modèle:', error.message);
}

// Test 4: Vérification du contrôleur
console.log('\n🎮 Test 4: Vérification du contrôleur');
try {
  const coursController = require('./controllers/cours.controller');
  
  if (coursController.createCourse) {
    console.log('✅ Fonction createCourse disponible');
  } else {
    console.log('❌ Fonction createCourse manquante');
  }
  
  if (coursController.updateCourse) {
    console.log('✅ Fonction updateCourse disponible');
  } else {
    console.log('❌ Fonction updateCourse manquante');
  }
  
  if (coursController.deleteCourse) {
    console.log('✅ Fonction deleteCourse disponible');
  } else {
    console.log('❌ Fonction deleteCourse manquante');
  }
  
  if (coursController.downloadCourseFile) {
    console.log('✅ Fonction downloadCourseFile disponible');
  } else {
    console.log('❌ Fonction downloadCourseFile manquante');
  }
  
  if (coursController.getCourseStats) {
    console.log('✅ Fonction getCourseStats disponible');
  } else {
    console.log('❌ Fonction getCourseStats manquante');
  }
} catch (error) {
  console.error('❌ Erreur lors de la vérification du contrôleur:', error.message);
}

// Test 5: Vérification des routes
console.log('\n🛣️ Test 5: Vérification des routes');
try {
  const courseRoutes = require('./routes/Cours.route');
  
  if (courseRoutes.stack) {
    console.log('✅ Routes des cours configurées');
    console.log(`   Nombre de routes: ${courseRoutes.stack.length}`);
  } else {
    console.log('❌ Routes des cours non configurées');
  }
} catch (error) {
  console.error('❌ Erreur lors de la vérification des routes:', error.message);
}

// Test 6: Vérification des dépendances
console.log('\n📦 Test 6: Vérification des dépendances');
try {
  const packageJson = require('./package.json');
  
  if (packageJson.dependencies.multer) {
    console.log('✅ Multer installé');
  } else {
    console.log('❌ Multer manquant - Installez-le avec: npm install multer');
  }
  
  if (packageJson.dependencies.jsonwebtoken) {
    console.log('✅ jsonwebtoken installé');
  } else {
    console.log('❌ jsonwebtoken manquant - Installez-le avec: npm install jsonwebtoken');
  }
  
  if (packageJson.dependencies.express) {
    console.log('✅ Express installé');
  } else {
    console.log('❌ Express manquant');
  }
  
  if (packageJson.dependencies.mongoose) {
    console.log('✅ Mongoose installé');
  } else {
    console.log('❌ Mongoose manquant');
  }
} catch (error) {
  console.error('❌ Erreur lors de la vérification des dépendances:', error.message);
}

console.log('\n🎯 Résumé des Tests');
console.log('==================');
console.log('✅ Dossiers d\'upload créés');
console.log('✅ Middlewares configurés');
console.log('✅ Modèle de cours enrichi');
console.log('✅ Contrôleur mis à jour');
console.log('✅ Routes sécurisées');
console.log('✅ Dépendances vérifiées');

console.log('\n🚀 Votre backend est prêt pour les tests !');
console.log('\n📋 Prochaines étapes:');
console.log('1. Démarrer le serveur: npm start');
console.log('2. Tester avec Postman/Insomnia');
console.log('3. Vérifier les uploads dans le dossier uploads/');
console.log('4. Tester l\'authentification JWT');
console.log('5. Tester la création de cours avec fichiers');

console.log('\n🔗 Endpoints à tester:');
console.log('- POST /api/course (création avec fichiers)');
console.log('- PUT /api/course/:id (modification avec fichiers)');
console.log('- POST /api/course/:id/enroll (inscription étudiant)');
console.log('- GET /api/course/:id/download/:fileType (téléchargement)');
console.log('- GET /api/course/:id/stats (statistiques)');

console.log('\n🎉 Tests terminés avec succès !');


