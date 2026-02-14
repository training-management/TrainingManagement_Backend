import User from "../models/User.model.js";
import Otp from "../models/otp.model.js";

// generate 6-digit OTP
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/* ================= SEND OTP ================= */
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    // 1️⃣ Check required field
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // 2️⃣ Email format validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // 3️⃣ Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 4️⃣ Prevent OTP spam (limit 1 OTP per 1 minute)
    const recentOtp = await Otp.findOne({
      email,
      purpose: "LOGIN",
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) },
    });

    if (recentOtp) {
      return res.status(429).json({
        success: false,
        message: "Please wait before requesting another OTP",
      });
    }

    // 5️⃣ Delete previous unused OTPs
    await Otp.deleteMany({
      email,
      purpose: "LOGIN",
      isUsed: false,
    });

    // 6️⃣ Generate new OTP
    const otp = generateOTP();

    await Otp.create({
      email,
      otp,
      purpose: "LOGIN",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // ✅ 10 minutes
    });

    // TODO: Send OTP via email service here (nodemailer)

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully. It will expire in 10 minutes.",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= VERIFY OTP ================= */
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP format",
      });
    }

    const otpRecord = await Otp.findOne({
      email,
      otp,
      purpose: "LOGIN",
      isUsed: false,
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (otpRecord.expiresAt < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Mark user verified
    await User.updateOne({ email }, { isVerified: true });

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};