require("dotenv").config()
const mongoose = require("mongoose")
//la connection de mongodb
mongoose.connect(process.env.MB_url)
.then(res => console.log("la connection db reuissi! ❎"))
.catch(e => console.log("la connection db echoué❌"))


