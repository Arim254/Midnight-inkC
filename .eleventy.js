// .eleventy.js
const path = require("path");
const fs = require("fs");

module.exports = function (eleventyConfig) {
  // ----- readableDate filter (safe) -----
  eleventyConfig.addFilter("readableDate", (dateInput) => {
    if (!dateInput) return "";
    try {
      // Accept a Date or a string. Use Date.parse fallback.
      const d = (dateInput instanceof Date) ? dateInput : new Date(String(dateInput));
      if (isNaN(d)) return String(dateInput);
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }); // "27 Aug 2025"
    } catch (e) {
      return String(dateInput);
    }
  });

  // Passthroughs (unchanged)
  eleventyConfig.addPassthroughCopy("src/styles");
  eleventyConfig.addPassthroughCopy("src/scripts");
  eleventyConfig.addPassthroughCopy("assets");

  // Auto-load JSON from src/data as global data
  const dataDir = path.join(__dirname, "src/data");
  if (fs.existsSync(dataDir)) {
    const files = fs.readdirSync(dataDir);
    files.forEach((file) => {
      if (!file.endsWith(".json")) return;
      const name = path.basename(file, ".json"); // e.g. techp
      eleventyConfig.addGlobalData(name, () => {
        const full = path.join(dataDir, file);
        try {
          const raw = fs.readFileSync(full, "utf-8").trim();
          if (!raw) {
            console.warn(`⚠️ ${file} is empty — returning [] for global "${name}"`);
            return [];
          }
          const parsed = JSON.parse(raw);
          console.log(`✅ Loaded data file: ${file} as global "${name}" (items: ${Array.isArray(parsed) ? parsed.length : "1"})`);
          return parsed;
        } catch (err) {
          console.error(`❌ Error loading ${file} into global "${name}": ${err.message}`);
          // Return empty array so site still builds
          return [];
        }
      });
    });
  } else {
    console.warn(`⚠️ data dir not found at ${dataDir}`);
  }

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "includes",
      layouts: "layouts",
      data: "data",
    },
  };
};
