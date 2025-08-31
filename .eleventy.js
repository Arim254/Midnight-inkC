// .eleventy.js
const path = require("path");
const fs = require("fs");
const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {
  // Passthrough assets
  eleventyConfig.addPassthroughCopy("src/styles");
  eleventyConfig.addPassthroughCopy("src/scripts");
  eleventyConfig.addPassthroughCopy("assets");

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
