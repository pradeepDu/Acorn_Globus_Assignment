const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp, name) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Your OTP for Court Booking Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Court Booking Platform!</h2>
        <p>Hi ${name || 'there'},</p>
        <p>Your One-Time Password (OTP) for verification is:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #4CAF50; letter-spacing: 5px; margin: 0;">${otp}</h1>
        </div>
        <p>This OTP will expire in ${process.env.OTP_EXPIRE_MINUTES || 10} minutes.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">Court Booking Platform - Sports Facility Management</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

// Send booking confirmation email
const sendBookingConfirmation = async (email, bookingDetails) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Booking Confirmation - Court Booking Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Booking Confirmed!</h2>
        <p>Your court booking has been confirmed.</p>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
          <h3 style="margin-top: 0;">Booking Details:</h3>
          <p><strong>Court:</strong> ${bookingDetails.courtName}</p>
          <p><strong>Date:</strong> ${bookingDetails.date}</p>
          <p><strong>Time:</strong> ${bookingDetails.startTime} - ${bookingDetails.endTime}</p>
          ${bookingDetails.coach ? `<p><strong>Coach:</strong> ${bookingDetails.coach}</p>` : ''}
          ${bookingDetails.equipment ? `<p><strong>Equipment:</strong> ${bookingDetails.equipment}</p>` : ''}
          <p><strong>Total Amount:</strong> ₹${bookingDetails.totalAmount}</p>
        </div>
        <p style="margin-top: 20px;">Thank you for choosing our facility!</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

// Send waitlist notification
const sendWaitlistNotification = async (email, details) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Court Available - Waitlist Notification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Good News! Court is Now Available</h2>
        <p>A court you're waiting for is now available:</p>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
          <p><strong>Court:</strong> ${details.courtName}</p>
          <p><strong>Date:</strong> ${details.date}</p>
          <p><strong>Time:</strong> ${details.startTime} - ${details.endTime}</p>
        </div>
        <p style="margin-top: 20px;">
          <a href="${process.env.CLIENT_URL}/booking?court=${details.courtId}&date=${details.date}" 
             style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Book Now
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">This notification expires in 30 minutes.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendBookingConfirmation,
  sendWaitlistNotification,
};
