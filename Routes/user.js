const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const z = require("zod");
const { User , Account } = require("../Database/db");
const { JWT_Secret } = require("../config");
const authMiddleware = require("../middleware")


const router = express.Router();

router.get("/", (req, res) => {
  console.log("hii users");
  res.send("welcome to home page");
});

const signupSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
});

router.post("/signup", async (req, res) => {
  const { success } = signupSchema.safeParse(req.body);
  if (!success) {
    return res.status(400).json({ message: "Incorrect Inputs" });
  }

  const existingUser = await User.findOne({
    email: req.body.email,
  });

  if (existingUser) {
    return res.status(400).json({ message: "Email already taken" });
  }

  const hashedPassword = bcrypt.hashSync(req.body.password, 12);

  const user = await User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: hashedPassword,
  });

  const userId = user._id;

  const account = await Account.create({
    userId: userId,
    balance : 1 + Math.floor(Math.random()*100000)
  })

  const token = jwt.sign(
    {
      userId,
    },
    JWT_Secret
  );

  return res.json({
    message: "User created successfully",
    token,
  });

});

const signinBody = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post("/signin", async (req, res) => {
  try {
    const { success } = signinBody.safeParse(req.body);

    if (!success) {
      return res.status(400).json({ message: "Incorrect Inputs" });
    }

    const existingUser = await User.findOne({
      email: req.body.email,
    });

    if (!existingUser) {
      return res.status(400).json({ message: "Email not found" });
    }

    const result = bcrypt.compareSync(req.body.password, existingUser.password);

    if (!result) {
      return res.status(400).json({ message: "Incorrect Password" });
    }

    const token = jwt.sign(
        {
          userId : existingUser._id
        },
        JWT_Secret
      );
    
      return res.json({
        message: "User Logged in successfully",
        token,
      });

  } catch (err) {
    return res.status(500).json({ message: "Error while logging in..." });
  }
});

router.get("/login" , authMiddleware , async (req,res)=>{
  if(req.userId){
    const user = await User.findById(req.userId);
    return res.json({
      message : `Welcome ${user.firstName} ${user.lastName}`,
      user : {
        id : user._id,
        firstName : user.firstName,
        lastName : user.lastName,
        email : user.email,
      }
    });
  }
  return res.status(404).json({
    message : "User not found"
  })
})

const updateBody = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  password: z.string().optional()
})

router.put("/update", authMiddleware ,async (req,res)=>{
  const {success} = updateBody.safeParse(req.body);
  if(!success){
    return res.status(400).json({message: "Incorrect Inputs" })
  }
  const user = await User.findByIdAndUpdate(req.userId, req.body, {new: true})
  return res.json({message: "User updated successfully", user : {
    id : user._id,
    firstName : user.firstName,
    lastName : user.lastName,
    email : user.email,
  }})
})

router.get("/bulk" , authMiddleware , async (req ,res)=> {
  try{
    const filter = req.query.filter;
    const query = { _id : {$ne: req.userId}};

    if(filter){
      query.$or = [
        {firstName : new RegExp(filter , 'i')},
        {lastName : new RegExp(filter , 'i')}
      ];
    }

    const users = await User.find(query);
    return res.json({"user" : users.map(user => ({
      id : user._id,
      firstName : user.firstName,
      lastName : user.lastName,
      email : user.email,
    }))});
  }
  catch(err){
    return res.status(500).json({message: "Error while fetching users..." })
  }
})

module.exports = router;
