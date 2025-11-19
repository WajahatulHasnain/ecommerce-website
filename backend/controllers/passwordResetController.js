const Admin = require("../models/Admin");
const Customer = require("../models/Customer");
const jwt = require("jsonwebtoken");
const sendOtpEmail = require("../utils/sendOtpEmail");

// Send password reset code
exports.sendResetCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ msg: "Email is required" });
    }

    console.log('🔍 Looking for user with email:', email);

    // Check both admin and customer collections
    let user = await Admin.findOne({ email: email.toLowerCase().trim() });
    let userType = 'admin';
    
    if (!user) {
      user = await Customer.findOne({ email: email.toLowerCase().trim() });
      userType = 'customer';
    }

    if (!user) {
      console.log('❌ No user found with email:', email);
      return res.status(404).json({ msg: "No account found with this email address" });
    }

    console.log(`✅ Found ${userType}:`, email);

    // Generate reset code
    const resetCode = user.generateResetCode();
    await user.save();

    console.log(`🔐 Generated reset code for ${email}: ${resetCode}`);

    // Send OTP email
    const emailResult = await sendOtpEmail(user.email, resetCode, user.name);

    if (emailResult.success) {
      let message;
      let responseData = {
        success: true,
        method: emailResult.method
      };

      if (emailResult.method === 'console' || emailResult.devMode) {
        message = 'Reset code generated. Check console for development code.';
        responseData.devCode = resetCode;
        responseData.devMode = true;
      } else {
        message = `Reset code sent to ${user.email}. Please check your inbox and spam folder.`;
        responseData.emailId = emailResult.emailId || emailResult.messageId;
      }

      responseData.msg = message;
      res.json(responseData);
    } else {
      console.log('❌ All email methods failed');
      
      // Still return success with console fallback
      res.json({
        success: true,
        msg: 'Email service temporarily unavailable. Your reset code is displayed in the server console.',
        devMode: true,
        devCode: resetCode,
        error: emailResult.error
      });
    }
  } catch (error) {
    console.error('❌ Send reset code error:', error);
    res.status(500).json({ msg: "Something went wrong. Please try again." });
  }
};

// Verify reset code
exports.verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ msg: "Email and code are required" });
    }

    // Check both collections
    let user = await Admin.findOne({ email: email.toLowerCase().trim() });
    let userType = 'admin';
    
    if (!user) {
      user = await Customer.findOne({ email: email.toLowerCase().trim() });
      userType = 'customer';
    }

    if (!user || !user.isResetCodeValid(code)) {
      return res.status(400).json({ msg: "Invalid or expired verification code" });
    }

    // Generate temporary reset token
    const resetToken = jwt.sign(
      { userId: user._id, email: user.email, resetCode: code, userType },
      process.env.JWT_SECRET + user.password,
      { expiresIn: '15m' }
    );

    user.resetToken = resetToken;
    await user.save();

    res.json({
      success: true,
      resetToken,
      userType,
      msg: "Code verified successfully"
    });
  } catch (error) {
    console.error('❌ Verify reset code error:', error);
    res.status(500).json({ msg: "Something went wrong. Please try again." });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword, resetToken } = req.body;

    if (!email || !newPassword || !resetToken) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters" });
    }

    // Check both collections
    let user = await Admin.findOne({ 
      email: email.toLowerCase().trim(),
      resetToken: resetToken 
    });
    let userType = 'admin';
    
    if (!user) {
      user = await Customer.findOne({ 
        email: email.toLowerCase().trim(),
        resetToken: resetToken 
      });
      userType = 'customer';
    }

    if (!user) {
      return res.status(400).json({ msg: "Invalid reset token" });
    }

    // Verify reset token
    try {
      jwt.verify(resetToken, process.env.JWT_SECRET + user.password);
    } catch (error) {
      return res.status(400).json({ msg: "Invalid or expired reset token" });
    }

    // Update password
    user.password = newPassword; // Will be hashed by pre-save middleware
    user.clearResetFields();
    await user.save();

    console.log(`✅ Password reset successful for ${userType}:`, email);

    res.json({
      success: true,
      msg: "Password reset successfully. You can now login with your new password."
    });
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ msg: "Something went wrong. Please try again." });
  }
};
