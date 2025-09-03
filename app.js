const express = require("express");
const morgan = require("morgan")
const userRoute = require("./routes/User.route");
const courseRoute = require("./routes/Cours.route")
const dashboardRoute = require("./routes/Dashboard.route");
const progressionRoute = require("./routes/Progression.route");
const reviewRoute = require("./routes/Review.route");
const purchaseRoute = require("./routes/Purchase.route");
const notificationRoute = require("./routes/Notification.route");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const app = express();

const PORT =process.env.PORT || 3000;





//les middlewares
app.use(express.json())
app.use(morgan("dev"))
app.use(helmet());
app.use(cors({
    origin: ["http://localhost:5173"], // à adapter selon le front
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true
}));
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limite chaque IP à 100 requêtes par fenêtre
    standardHeaders: true,
    legacyHeaders: false,
}))


//les api 
app.use("/api/users",userRoute);
app.use("/api/course",courseRoute);
app.use("/api/dashboard", dashboardRoute);
app.use("/api/progress", progressionRoute);
app.use("/api/reviews", reviewRoute);
app.use("/api/purchase", purchaseRoute);
app.use("/api/notifications", notificationRoute);



app.get("/",(req,res)=>{
    res.send("bienvenue dans la formation nodejs")
});


app.listen(PORT,()=>{
    console.log(`le server ecoute sur le port ${PORT}`)
})