const express = require("express");
const authMiddleware = require("../middleware");
const {Account} = require("../Database/db")
const mongoose = require("mongoose");

const router = express.Router();


router.get("/",(req,res) => {
    console.log("hii users");
    res.send("welcome to account page");
})


router.get("/balance",authMiddleware ,async (req,res) => {
    try{
        const account = await Account.findOne({userId : req.userId});
        res.json({balance : account.balance});
    }
    catch(err){
        res.send("Bank server down .. please try after some time")
    }
})

router.post("/transfer",authMiddleware , async (req,res) => {
    try{
        const session = await mongoose.startSession();

        session.startTransaction();
        const {amount,receiverId} = req.body;

        const account = await Account.findOne({userId : req.userId}).session(session);

        
        if(!account){
            await session.abortTransaction();
            res.status(404).json({message : "Account not found"})
        }
        
        if(account.balance < amount) {
            await session.abortTransaction();
            return res.status(404).json({
                message: "Insufficient balance"
            });
        }
        
        const toAccount = await Account.findOne({userId : receiverId}).session(session);
        
        if(!toAccount){
            await session.abortTransaction();
            return res.status(404).json({message : "Receiver account not found"})
        }

        await Account.updateOne({userId : req.userId} , {$inc : { balance : -amount}}).session(session);
        await Account.updateOne({userId : receiverId} , {$inc : { balance : amount}}).session(session);

        await session.commitTransaction();
        return res.json({
            message : "Transfer successful"
        })
    }
    catch(err){
        console.log(err);
        return res.status(444).json({
            message: "Error occurred during transfer"
        })
    }

})

module.exports = router;