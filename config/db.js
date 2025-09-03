const mongoose = require("mongoose")
//la connection de mongodb
mongoose.connect("mongodb://127.0.0.1:27017/plate-form")
.then(res => console.log("la connection db reuissi! ❎"))
.catch(e => console.log("la connection db echoué❌"))


module.exports = mongoose;