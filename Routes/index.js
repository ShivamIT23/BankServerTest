const express = require("express");
const userRouter = require("./user.js")
const bankRouter = require("./bank.js")

const router = express.Router();


router.get("/",(req,res) => {
    res.send("Hello Worl2d");
})


router.use("/user", userRouter)

router.use("/account", bankRouter)


module.exports = router;