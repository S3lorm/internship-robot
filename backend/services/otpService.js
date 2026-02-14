class OTPService {
    constructor() {
        this.otpStore = {}; // store OTPs
    }

    generateOTP(userId) {
        const otp = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit OTP
        this.otpStore[userId] = otp; // Store OTP by userId
        return otp;
    }

    verifyOTP(userId, otp) {
        const storedOtp = this.otpStore[userId];
        if (storedOtp && storedOtp === otp) {
            delete this.otpStore[userId]; // Remove OTP after successful verification
            return true;
        }
        return false;
    }
}

module.exports = OTPService;