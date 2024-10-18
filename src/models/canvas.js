const mongoose = require("mongoose");

const PixelSchema = new mongoose.Schema({
  x: Number,
  y: Number,
  color: String,
});

const CanvasSchema = new mongoose.Schema({
  width: Number,
  height: Number,
  pixels: [PixelSchema],
});

module.exports = mongoose.model("Canvas", CanvasSchema);
