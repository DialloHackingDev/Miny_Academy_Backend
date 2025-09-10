// ... existing code ...

// Import des routes
const authRoutes = require('./routes/Auth.route');
const coursRoutes = require('./routes/Cours.route');
const dashboardRoutes = require('./routes/Dashboard.route');
const progressionRoutes = require('./routes/Progression.route');
const profileRoutes = require('./routes/Profile.route'); // Nouvelle route

// ... existing code ...

// Utilisation des routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', coursRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/progression', progressionRoutes);
app.use('/api/users/profile', profileRoutes); // Nouvelle route

// ... existing code ...