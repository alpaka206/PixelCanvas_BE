const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const userService = require("../services/userService");

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google 로그인 엔드포인트 (POST 방식)
router.post("/google-login", async (req, res) => {
  const { token: idToken } = req.body;

  try {
    // Google ID Token 검증
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    // 사용자 정보 확인 및 DB 저장
    let user = await User.findOne({ googleId: payload.sub });
    if (!user) {
      user = new User({
        googleId: payload.sub,
        username: payload.name,
      });
      await user.save();
    }

    // 액세스 토큰 및 리프레시 토큰 생성
    const accessToken = userService.generateAccessToken(user._id);
    const refreshToken = userService.generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    // HTTP-Only 쿠키로 토큰 설정
    res
      .cookie("access_token", accessToken, {
        httpOnly: true,
        sameSite: "Lax",
      })
      .cookie("refresh_token", refreshToken, {
        httpOnly: true,
        sameSite: "Lax",
      })
      .status(200)
      .json({ success: true });
  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(500).json({ error: "Authentication error" });
  }
});

// 토큰 갱신 엔드포인트
router.post("/refresh-token", async (req, res) => {
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token not found" });
  }

  try {
    // 리프레시 토큰 검증
    const decoded = userService.verifyToken(refreshToken);
    if (!decoded)
      return res.status(403).json({ message: "Invalid refresh token" });

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // 새 액세스 토큰 발급
    const newAccessToken = userService.generateAccessToken(user._id);
    res
      .cookie("access_token", newAccessToken, {
        httpOnly: true,
        sameSite: "Lax",
      })
      .status(200)
      .json({ success: true });
  } catch (error) {
    console.error("Refresh Token Error:", error);
    res.status(500).json({ error: "Failed to refresh token" });
  }
});

// 로그아웃 엔드포인트
router.get("/logout", (req, res) => {
  res
    .clearCookie("access_token")
    .clearCookie("refresh_token")
    .status(200)
    .json({ success: true });
});

// 사용자 인증 확인 엔드포인트
router.get("/authenticate", (req, res) => {
  const accessToken = req.cookies["access_token"];
  if (!accessToken) return res.status(401).send("Unauthorized");

  try {
    jwt.verify(accessToken, process.env.JWT_SECRET);
    res.status(200).send("Authenticated");
  } catch (error) {
    res.status(401).send("Unauthorized");
  }
});

module.exports = router;
