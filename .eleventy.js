const path = require("path");
const fs = require("fs");
const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {
  // Passthrough assets
  eleventyConfig.addPassthroughCopy("src/styles");
  eleventyConfig.addPassthroughCopy("src/scripts");
  eleventyConfig.addPassthroughCopy("assets");
  
  // CRITICAL FIX: Ensure the entire admin directory is copied,
  // including index.html and config.yml inside it.
  eleventyConfig.addPassthroughCopy({ "./admin": "/admin" });
  
  eleventyConfig.addPassthroughCopy("sitemap.xml");

  eleventyConfig.addFilter("readableDate", dateString => {
    if (typeof dateString !== 'string' || dateString.trim() === '') {
      return ''; // or a default value
    }
    try {
      const dt = DateTime.fromISO(dateString);
      if (dt.isValid) {
        return dt.toFormat("dd LLL yyyy");
      }
      return ''; // or handle invalid date string
    } catch (error) {
      console.error("Error formatting date:", error);
      return ''; // or handle error
    }
  });

  eleventyConfig.addFilter("randomSlice", (arr, count) => {
    if (!Array.isArray(arr)) {
      return [];
    }
    const shuffled = arr.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  });

  eleventyConfig.addFilter("truncate", (str, len) => {
    if (!str || typeof str !== 'string') return '';
    if (str.length <= len) return str;
    return str.slice(0, len) + '...';
  });

  // Create collections for new content types
  eleventyConfig.addCollection("recipes", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/recipes/**/*.md").sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("diy", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/diy/**/*.md").sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("health", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/health/**/*.md").sort((a, b) => b.date - a.date);
  });

  // Auto-load JSON from src/data as global data
  // const dataDir = path.join(__dirname, "src/data");
  // if (fs.existsSync(dataDir)) {
  //   const files = fs.readdirSync(dataDir);
  //   files.forEach((file) => {
  //     if (!file.endsWith(".json")) return;
  //     const name = path.basename(file, ".json"); // e.g. techp
  //     eleventyConfig.addGlobalData(name, () => {
  //       const full = path.join(dataDir, file);
  //       try {
  //         const raw = fs.readFileSync(full, "utf-8").trim();
  //         if (!raw) {
  //           console.warn(`⚠️ ${file} is empty — returning [] for global "${name}"`);
  //           return [];
  //         }
  //         const parsed = JSON.parse(raw);
  //         console.log(`✅ Loaded data file: ${file} as global "${name}" (items: ${Array.isArray(parsed) ? parsed.length : '1'})`);
  //         return parsed;
  //       } catch (err) {
  //         console.error(`❌ Error loading ${file} into global "${name}": ${err.message}`);
  //         // Return empty array so site still builds
  //         return [];
  //       }
  //     });
  //   });
  // } else {
  //   console.warn(`⚠️ data dir not found at ${dataDir}`);
  // }

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "includes",
      layouts: "layouts",
      data: "data"
    }
  };
};
