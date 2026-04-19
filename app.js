
//la partie app de mon application
const express = require("express");
const morgan = require("morgan")
const userRoute = require("./routes/User.route");
const courseRoute = require("./routes/Cours.route")
const dashboardRoute = require("./routes/Dashboard.route");
const progressionRoute = require("./routes/Progression.route");
const reviewRoute = require("./routes/Review.route");
const purchaseRoute = require("./routes/Purchase.route");
const notificationRoute = require("./routes/Notification.route");
const cartRoute = require("./routes/Cart.route");
const profileRoute = require("./routes/Profile.route");
const helmet = require("helmet");
const cors = require("cors");
const cookie = require("cookie-parser")
const rateLimit = require("express-rate-limit");
const path = require("path");
const app = express();

const PORT = process.env.PORT || 5000;





// Middleware de logging personnalisé (avant tout)
app.use((req, res, next) => {
    console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    next();
});

//les middlewares
app.use(express.json())
app.use(cookie())
app.use(morgan("dev"))
app.use(helmet());
app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:42157",
        "http://localhost:42157",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true
}));
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limite chaque IP à 100 requêtes par fenêtre
    standardHeaders: true,
    legacyHeaders: false,
}))

// Exposer les fichiers uploadés (PDFs/Vidéos) de façon statique avec CORS headers
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res, path) => {
        res.set("Access-Control-Allow-Origin", "*");
        res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
        res.set("Cross-Origin-Resource-Policy", "cross-origin");
    }
}));


//les api 
app.use("/api/users",userRoute);
app.use("/api/course",courseRoute);
app.use("/api/dashboard", dashboardRoute);
app.use("/api/progress", progressionRoute);
app.use("/api/reviews", reviewRoute);
app.use("/api/purchase", purchaseRoute);
app.use("/api/notifications", notificationRoute);
app.use("/api/cart", cartRoute);
app.use("/api/users/profile", profileRoute);



// Endpoint healthcheck pour Docker
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// app.get("/",(req,res)=>{
//     res.send("bienvenue dans la formation nodejs")
// });


app.listen(PORT, '0.0.0.0', () => {
    console.log(`Le serveur écoute sur http://0.0.0.0:${PORT} ✅`);
});