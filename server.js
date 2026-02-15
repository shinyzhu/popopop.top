const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

const FONTS_DIR = path.join(__dirname, "public", "fonts");
const FONT_EXTENSIONS = new Set([".ttf", ".otf", ".woff", ".woff2"]);

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

// API: list available server-side fonts
app.get("/api/fonts", async (req, res) => {
  try {
    const files = await fs.promises.readdir(FONTS_DIR);
    const fonts = files
      .filter((f) => FONT_EXTENSIONS.has(path.extname(f).toLowerCase()))
      .map((f) => ({
        file: f,
        name: f.replace(/\.[^.]+$/, ""),
        url: `/fonts/${f}`,
      }));
    res.json(fonts);
  } catch (err) {
    // If fonts directory doesn't exist yet, just return empty list
    if (err.code === "ENOENT") return res.json([]);
    console.error("Error reading fonts directory:", err);
    res.status(500).json({ error: "Failed to list fonts" });
  }
});

app.listen(PORT, () => {
  console.log(`POPoPOP server running at http://localhost:${PORT}`);
});
