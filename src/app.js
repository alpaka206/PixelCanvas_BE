const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/database");
const apiRoutes = require("./routes/api");
const canvasService = require("./services/canvasService");

dotenv.config();
connectDB();

const app = express();
// const server = http.createServer(app);
const server = require("http").createServer(app);
// const io = socketIo(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//   },
// });

const io = require("socket.io")(server, {
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
  })
);
app.use(express.json());
app.use("/api", apiRoutes);

const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 1024;

canvasService.initializeCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("updatePixel", async ({ x, y, color }) => {
    const updatedPixel = await canvasService.updatePixel(x, y, color);
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
