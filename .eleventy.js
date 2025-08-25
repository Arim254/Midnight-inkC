const path = require("path");
const fs = require("fs");

module.exports = function (eleventyConfig) {
  // Passthrough copies
  eleventyConfig.addPassthroughCopy("src/styles");
  eleventyConfig.addPassthroughCopy("src/scripts");
  eleventyConfig.addPassthroughCopy("assets");

  // Auto-load all JSON files in src/data/
  const dataDir = path.join(__dirname, "src/data");
  if (fs.existsSync(dataDir)) {
    const files = fs.readdirSync(dataDir);
    files.forEach((file) => {
      if (file.endsWith(".json")) {
        const name = path.basename(file, ".json"); // e.g. "tech" or "techp"
        eleventyConfig.addGlobalData(name, () => {
          try {
            const content = fs.readFileSync(path.join(dataDir, file), "utf-8").trim();
            if (!content) {
              console.warn(`⚠️ ${file} is empty, returning []`);
              return [];
            }
            return JSON.parse(content);
          } catch (err) {
            console.error(`❌ Error loading ${file}:`, err.message);
            return [];
          }
        });
        console.log(`✅ Loaded data file: ${file} as global "${name}"`);
      }
    });
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
