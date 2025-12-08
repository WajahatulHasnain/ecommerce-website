const Customer = require("../models/Customer");
const jwt = require("jsonwebtoken");

const generateToken = (customer) => {
  return jwt.sign(
    { id: customer._id, role: customer.role, email: customer.email },
    process.env.JWT_SECRET || "your_jwt_secret_fallback",
    { expiresIn: "7d" }
  );
};

exports.registerCustomer = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    console.log('Customer registration attempt:', { name, email });
    
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

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ email: email.toLowerCase() });
    if (existingCustomer) {
      console.log('Customer already exists:', email);
      return res.status(400).json({ 
        success: false,
        msg: "Customer with this email already exists" 
      });
    }

    // Create new customer
    const customer = new Customer({ 
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      role: "customer" 
    });
    
    await customer.save();
    console.log('Customer registered successfully:', customer.email);
    
    const token = generateToken(customer);

    res.status(201).json({
      success: true,
      token,
      user: { 
        id: customer._id, 
        name: customer.name, 
        email: customer.email, 
        role: customer.role 
      }
    });
  } catch (err) {
    console.error('Customer registration error:', err);
    res.status(500).json({ 
      success: false,
      msg: "Registration failed. Please try again." 
    });
  }
};

exports.loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Customer login attempt:', email);
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        msg: "Email and password are required" 
      });
    }

    // Find customer by email
    const customer = await Customer.findOne({ email: email.toLowerCase().trim() });
    
    if (!customer) {
      console.log('Customer not found:', email);
      return res.status(400).json({ 
        success: false,
        msg: "Incorrect email address. No account found with this email." 
      });
    }

    // Check password
    const isMatch = await customer.matchPassword(password);
    console.log('Password match result:', isMatch);
    
    if (!isMatch) {
      console.log('Invalid password for customer:', email);
      return res.status(400).json({ 
        success: false,
        msg: "Incorrect password. Please try again." 
      });
    }

    const token = generateToken(customer);
    console.log('Customer login successful:', email);

    res.json({
      success: true,
      token,
      user: { 
        id: customer._id, 
        name: customer.name, 
        email: customer.email, 
        role: customer.role 
      }
    });
  } catch (err) {
    console.error('Customer login error:', err);
    res.status(500).json({ 
      success: false,
      msg: "Login failed. Please try again." 
    });
  }
};
