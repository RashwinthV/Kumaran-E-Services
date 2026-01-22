const nodemailer = require("nodemailer");

const sendOTP = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // use TLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Password Reset OTP - Kumaran E-Services",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Kumaran E-Services</h2>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 16px; color: #555;">Hello,</p>
          <p style="font-size: 16px; color: #555;">You requested to reset your password. Use the OTP below to complete the process:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #000;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #888;">This OTP is valid for 3 minutes. If you did not request this, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #aaa; text-align: center;">© ${new Date().getFullYear()} Kumaran E-Services. All rights reserved.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
};

module.exports = { sendOTP };
