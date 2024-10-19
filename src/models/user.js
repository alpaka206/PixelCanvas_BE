const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  username: String,
  lastPlacedAt: { type: Date, default: new Date(0) }, // 초기화 시 과거 날짜로 설정
  refreshToken: { type: String }, // 리프레시 토큰 필드 추가
});

module.exports = mongoose.model("User", UserSchema);
