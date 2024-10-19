const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const cookie = require("cookie");
const connectDB = require("./config/database");
const userService = require("./services/userService");
const authRoutes = require("./routes/auth");
const canvasService = require("./services/canvasService");
const User = require("./models/user");

connectDB();

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: "http://localhost:5173", // 프론트엔드 주소
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: [
      "Cross-Origin-Opener-Policy",
      "Cross-Origin-Embedder-Policy",
    ],
  })
);
app.use(express.json());
app.use(cookieParser());

canvasService.initializeCanvas(64, 64);

app.use("/auth", authRoutes);

// 소켓 인증 미들웨어
io.use(async (socket, next) => {
  const cookies = cookie.parse(socket.request.headers.cookie || "");
  const accessToken = cookies["access_token"];
  // const accessToken = socket.request.cookies["access_token"];
  if (!accessToken) return next(new Error("Authentication error"));

  const decoded = userService.verifyToken(accessToken);
  if (!decoded) return next(new Error("Authentication error"));

  const user = await User.findById(decoded.id);
  if (!user) return next(new Error("User not found"));

  socket.user = user;
  next();
});

// 소켓 통신 설정
io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("getCanvas", async () => {
    if (!socket.user) return socket.emit("error", "Unauthorized");
    const canvas = await canvasService.getCanvas();
    socket.emit("canvasData", canvas);
  });

  socket.on("updatePixel", async ({ x, y, color }) => {
    if (!socket.user) return socket.emit("error", "Unauthorized");

    const now = new Date();
    const timeDifference = now - socket.user.lastPlacedAt;
    if (timeDifference < 60000) return socket.emit("error", "1분 대기 필요");

    const updatedPixel = await canvasService.updatePixel(x, y, color);
    socket.user.lastPlacedAt = now;
    await User.findByIdAndUpdate(socket.user._id, { lastPlacedAt: now });

    io.emit("pixelUpdated", updatedPixel);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
