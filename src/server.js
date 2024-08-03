const express = require("express");
const app = express();
const indexRouter = require("../Routes/index")
const cors = require("cors");

const port = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());


app.get("/",(req,res)=>{
    res.send("Hello World");
})

app.use("/api/v1", indexRouter)

app.use((err,req,res,next) => {
    console.log(err)
    res.status(500).json({message: "Internal Server Error"});
})

app.listen(3000 ,()=>{
    console.log("server is running on port " + port);
})
