import express from 'express';
import User from '../models/User.js';  // ✅ Import the User model
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';



const router = express.Router();

router.post('/register', async (req, res) => {
  try {
      const { name,designation, email, password } = req.body;

      if (!name || !email || !password || !designation) {
          return res.status(400).json({ message: "All fields are required" });
      }

      let existingUser = await User.findOne({
          $or: [{ email }, { name }]
      });

      if (existingUser) {
          return res.status(400).json({
              message: 'User already exists'
          });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = new User({
          name,
          designation,
          email,
          password: hashedPassword
      });

      await user.save();

      // Create token without 'Bearer' prefix - we'll add it in the response
      const token = jwt.sign(
          { id: user._id },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
      );

      return res.status(201).json({
          success: true,
          token: `Bearer ${token}`,
          user: {
              id: user._id,
              name: user.name,
              designation:user.designation,
              email: user.email
          }
      });
  } catch (error) {
      console.error("Error in /register:", error);
      return res.status(500).json({
          success: false,
          message: 'Signup failed',
          error: error.message
      });
  }
});
router.post('/login', async(req,res)=>{
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: 'Invalid login credentials'
      });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: 'Invalid login credentials'
      });
    }
    
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.status(200).json({
      success: true,
      token: `Bearer ${token}`,
      user: {
        id: user._id,
        name: user.name,
        designation:user.designation,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Login failed',
      error: error.message
    });
  }
});





export default router;
