const sendOtpEmail = async (email, otp, userName = 'User') => {
  try {
    console.log('📧 Starting email send process...');
    console.log('Target email:', email);
    console.log('OTP:', otp);

    // Method 1: Try Resend API if configured
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey && resendKey !== 'your_api_key_here' && resendKey.startsWith('re_')) {
      try {
        const { Resend } = require('resend');
        const resend = new Resend(resendKey);
        
        console.log('🚀 Attempting Resend API...');
        
        const { data, error } = await resend.emails.send({
          from: process.env.EMAIL_FROM || 'Ecommerce <onboarding@resend.dev>',
          to: [email],
          subject: 'Your Password Reset Code',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2563eb; text-align: center;">Password Reset Code</h2>
              <div style="background: #f8fafc; padding: 30px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <p style="font-size: 18px; margin-bottom: 20px;">Hello ${userName},</p>
                <p style="font-size: 16px; margin-bottom: 30px;">Your verification code is:</p>
                <div style="font-size: 32px; font-weight: bold; color: #1f2937; letter-spacing: 4px; background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  ${otp}
                </div>
                <p style="color: #ef4444; font-size: 14px; margin-top: 20px;">
                  ⚠️ This code expires in 10 minutes
                </p>
              </div>
            </div>
          `
        });

        if (error) {
          console.error('❌ Resend error:', error);
          throw new Error(error.message);
        }

        console.log('✅ Email sent successfully via Resend');
        console.log('Email ID:', data.id);
        return { success: true, method: 'resend', emailId: data.id };

      } catch (resendError) {
        console.error('❌ Resend failed:', resendError.message);
      }
    } else {
      console.log('⚠️ Resend API key not configured properly');
    }

    // Method 2: Try Nodemailer as fallback
    try {
      const nodemailer = require('nodemailer');
      console.log('🔄 Trying Nodemailer fallback...');

      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASS;

      if (emailUser && emailPass) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: emailUser,
            pass: emailPass
          }
        });

        await transporter.verify();
        console.log('✅ Nodemailer connection verified');

        const info = await transporter.sendMail({
          from: `"Ecommerce App" <${emailUser}>`,
          to: email,
          subject: 'Password Reset Code',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>Password Reset Code</h2>
              <p>Hello ${userName},</p>
              <p>Your verification code is: <strong style="font-size: 24px; color: #2563eb;">${otp}</strong></p>
              <p>This code expires in 10 minutes.</p>
            </div>
          `
        });

        console.log('✅ Email sent via Nodemailer');
        return { success: true, method: 'nodemailer', messageId: info.messageId };
      }
    } catch (nodemailerError) {
      console.error('❌ Nodemailer failed:', nodemailerError.message);
    }

    // Method 3: Console fallback for development
    console.log('\n🔐 EMAIL SERVICE UNAVAILABLE - DEVELOPMENT MODE');
    console.log('=====================================');
    console.log(`📧 To: ${email}`);
    console.log(`👤 User: ${userName}`);
    console.log(`🔑 OTP Code: ${otp}`);
    console.log(`⏰ Expires: 10 minutes`);
    console.log('=====================================\n');

    return { 
      success: true, 
      method: 'console',
      devMode: true,
      otp: otp // Include OTP for development
    };

  } catch (error) {
    console.error('❌ Complete email failure:', error);
    return { 
      success: false, 
      error: error.message,
      devMode: true,
      otp: otp // Still include OTP for debugging
    };
  }
};

module.exports = sendOtpEmail;
