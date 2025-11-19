const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");

const generateToken = (admin) => {
  return jwt.sign(
    { id: admin._id, role: admin.role, email: admin.email },
    process.env.JWT_SECRET || "your_jwt_secret_fallback",
    { expiresIn: "7d" }
  );
};

exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    console.log('Admin registration attempt:', { name, email });
    
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        msg: "All fields are required" 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        msg: "Password must be at least 6 characters" 
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      console.log('Admin already exists:', email);
      return res.status(400).json({ 
        success: false,
        msg: "Admin with this email already exists" 
      });
    }

    // Create new admin
    const admin = new Admin({ 
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      role: "admin" 
    });
    
    await admin.save();
    console.log('Admin registered successfully:', admin.email);
    
    const token = generateToken(admin);

    res.status(201).json({
      success: true,
      token,
      user: { 
        id: admin._id, 
        name: admin.name, 
        email: admin.email, 
        role: admin.role 
      }
    });
  } catch (err) {
    console.error('Admin registration error:', err);
    res.status(500).json({ 
      success: false,
      msg: "Registration failed. Please try again." 
    });
  }
};

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Admin login attempt:', email);
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        msg: "Email and password are required" 
      });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    
    if (!admin) {
      console.log('Admin not found:', email);
      return res.status(400).json({ 
        success: false,
        msg: "Invalid admin credentials" 
      });
    }

    // Check password
    const isMatch = await admin.matchPassword(password);
    console.log('Password match result:', isMatch);
    
    if (!isMatch) {
      console.log('Invalid password for admin:', email);
      return res.status(400).json({ 
        success: false,
        msg: "Invalid admin credentials" 
      });
    }

    const token = generateToken(admin);
    console.log('Admin login successful:', email);

    res.json({
      success: true,
      token,
      user: { 
        id: admin._id, 
        name: admin.name, 
        email: admin.email, 
        role: admin.role 
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ 
      success: false,
      msg: "Login failed. Please try again." 
    });
  }
};
