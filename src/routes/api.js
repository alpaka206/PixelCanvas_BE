const express = require("express");
const router = express.Router();
const canvasService = require("../services/canvasService");

router.get("/canvas", async (req, res) => {
  try {
    const canvas = await canvasService.getCanvas();
    res.json(canvas);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
