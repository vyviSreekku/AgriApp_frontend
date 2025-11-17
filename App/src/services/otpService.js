// Simple in-memory OTP service for demo purposes only.
// Replace with real SMS provider (Twilio / Firebase) in production.

const store = {}; // { phone: { otp: '123456', expiresAt: timestamp } }

function randomOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default {
  sendOtp(phone, name) {
    return new Promise((resolve) => {
      const otp = randomOtp();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
      store[phone] = { otp, expiresAt, name };
      // Simulate SMS by logging to console (Metro/terminal)
      console.log(`Simulated SMS to ${phone}: Your PlantHub OTP is ${otp}`);
      // Simulate network latency
      setTimeout(() => resolve(true), 800);
    });
  },

  verifyOtp(phone, code) {
    return new Promise((resolve) => {
      const entry = store[phone];
      if (!entry) return resolve(false);
      if (Date.now() > entry.expiresAt) {
        delete store[phone];
        return resolve(false);
      }
      if (entry.otp === code) {
        delete store[phone];
        return resolve(true);
      }
      return resolve(false);
    });
  }
};
