// scripts/validate-data.js
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../src/data");

function validateFile(file) {
  const full = path.join(DATA_DIR, file);
  try {
    const raw = fs.readFileSync(full, "utf-8");
    JSON.parse(raw);
    console.log(`✅ ${file}: valid JSON`);
    return true;
  } catch (err) {
    console.error(`❌ ${file}: INVALID JSON — ${err.message}`);
    return false;
  }
}

if (!fs.existsSync(DATA_DIR)) {
  console.error("Data directory not found:", DATA_DIR);
  process.exit(1);
}

const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".json"));
let ok = true;
files.forEach(f => {
  const valid = validateFile(f);
  if (!valid) ok = false;
});

if (!ok) {
  console.error("\nFix the invalid JSON files above (common issues: trailing comma, partial writes).");
  process.exit(2);
} else {
  console.log("\nAll JSON files valid.");
  process.exit(0);
}
