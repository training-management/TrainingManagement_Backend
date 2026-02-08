import User from "../models/User.model.js";
import Otp from "../models/otp.model.js";

// generate 6-digit OTP
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/* ================= SEND OTP ================= */
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const otp = generateOTP();

    await Otp.create({
      email,
      otp,
      purpose: "LOGIN",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
    });

    res.status(200).json({
      success: true,
      message: "OTP generated and stored successfully",
      otp, // ⚠️ REMOVE THIS IN PRODUCTION
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/* ================= VERIFY OTP ================= */
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpRecord = await Otp.findOne({
      email,
      otp,
      purpose: "LOGIN",
      isUsed: false,
    });

    if (!otpRecord || otpRecord.expiresAt < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    otpRecord.isUsed = true;
    await otpRecord.save();

    await User.updateOne({ email }, { isVerified: true });

    res.json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
