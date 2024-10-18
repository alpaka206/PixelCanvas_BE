const Canvas = require("../models/canvas");

const initializeCanvas = async (width, height) => {
  const canvas = new Canvas({
    width,
    height,
    pixels: [],
  });
  await canvas.save();
  return canvas;
};

const updatePixel = async (x, y, color) => {
  const canvas = await Canvas.findOne();
  const pixelIndex = canvas.pixels.findIndex((p) => p.x === x && p.y === y);

  if (pixelIndex !== -1) {
    canvas.pixels[pixelIndex].color = color;
  } else {
    canvas.pixels.push({ x, y, color });
  }

  await canvas.save();
  return { x, y, color };
};

const getCanvas = async () => {
  return await Canvas.findOne();
};

module.exports = {
  initializeCanvas,
  updatePixel,
  getCanvas,
};
