const User = require("../models/User");
const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET || "fallback_secret",
    { expiresIn: "7d" }
  );
};

exports.registerCustomer = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ msg: "Email already registered" });
    }

    // Create new customer
    const user = new User({ 
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password, // Will be hashed by pre-save middleware
      role: "customer" 
    });
    
    await user.save();
    
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      }
    });
  } catch (err) {
    console.error('Customer registration error:', err);
    res.status(500).json({ msg: "Registration failed. Please try again." });
  }
};

exports.loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password are required" });
    }

    // Find customer by email and role
    const user = await User.findByEmailAndRole(email.toLowerCase().trim(), "customer");
    
    if (!user) {
      return res.status(400).json({ msg: "Invalid customer credentials" });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid customer credentials" });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      }
    });
  } catch (err) {
    console.error('Customer login error:', err);
    res.status(500).json({ msg: "Login failed. Please try again." });
  }
};
