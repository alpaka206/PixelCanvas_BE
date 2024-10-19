const Canvas = require("../models/canvas");

const initializeCanvas = async (width = 64, height = 64) => {
  const existingCanvas = await Canvas.findOne();
  if (!existingCanvas) {
    const canvas = new Canvas({
      width,
      height,
      pixels: Array.from({ length: height }, (_, y) =>
        Array.from({ length: width }, (_, x) => ({ x, y, color: "#ffffff" }))
      ).flat(),
    });
    await canvas.save();
    return canvas;
  }
  return existingCanvas;
};

const updatePixel = async (x, y, color) => {
  const canvas = await Canvas.findOne();
  await Canvas.updateOne(
    { _id: canvas._id, "pixels.x": x, "pixels.y": y },
    { $set: { "pixels.$.color": color } },
    { upsert: true }
  );
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
