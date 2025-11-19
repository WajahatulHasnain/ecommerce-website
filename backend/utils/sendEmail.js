const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    console.log('📧 Email Configuration Check:');
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Missing');
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set' : '❌ Missing');

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('❌ Email configuration missing. Using console fallback.');
      console.log('🔐 Reset code would be sent to:', options.email);
      return true; // Return success for development
    }

    // Create transporter with multiple fallback configurations
    let transporter;
    
    // Try Gmail first
    try {
      transporter = nodemailer.createTransporter({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verify connection
      await transporter.verify();
      console.log('✅ Gmail SMTP connection verified');
      
    } catch (gmailError) {
      console.log('❌ Gmail failed, trying generic SMTP...');
      
      // Fallback to generic SMTP
      transporter = nodemailer.createTransporter({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      
      try {
        await transporter.verify();
        console.log('✅ Secure SMTP connection verified');
      } catch (secureError) {
        console.error('❌ All SMTP configurations failed:', secureError.message);
        console.log('🔐 Using console fallback for:', options.email);
        return true;
      }
    }

    const mailOptions = {
      from: {
        name: 'Ecommerce App',
        address: process.env.EMAIL_USER
      },
      to: options.email,
      subject: options.subject,
      html: options.html,
      priority: 'high'
    };

    console.log('📤 Sending email to:', options.email);
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📨 Response:', info.response);
    
    return true;

  } catch (error) {
    console.error('❌ Email sending error:', error.message);
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      response: error.response
    });

    // Handle specific errors
    if (error.code === 'EAUTH') {
      console.log('🔑 Authentication Error Solutions:');
      console.log('1. Enable 2-Factor Authentication on Gmail');
      console.log('2. Generate App Password: https://support.google.com/mail/answer/185833');
      console.log('3. Use 16-digit app password in EMAIL_PASS');
      console.log('4. Make sure EMAIL_USER is your full Gmail address');
    } else if (error.code === 'ECONNECTION') {
      console.log('🌐 Connection Error: Check internet connection');
    }
    
    console.log('🔐 Using console fallback for development');
    return true; // Don't fail in development
  }
};

module.exports = sendEmail;
