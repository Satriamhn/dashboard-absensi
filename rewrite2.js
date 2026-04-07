
import fs from "fs";
let css = fs.readFileSync("src/index.css", "utf8");

// Fix login title background box
css = css.replace(/\.login-title\s*\{[\s\S]*?\}/, `.login-title {
  font-size: 1.85rem;
  font-weight: 800;
  margin-bottom: 4px;
  color: var(--text-primary);
}`);

css = css.replace(/\.logo-title\s*\{[\s\S]*?\}/, `.logo-title {
  display: block;
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--text-primary);
  white-space: nowrap;
}`);

// Fix Logo icon gradient
css = css.replace(/\.logo-icon\s*\{[\s\S]*?\}/, `.logo-icon {
  width: 40px;
  height: 40px;
  background: var(--brand);
  border-radius: var(--r-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}`);

// Fix Login background (remove inline gradients in index.css if any)
// Many login wrappers have additional blobs.
css = css.replace(/\.login-wrapper\s*\{[\s\S]*?\}/, `.login-wrapper {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--bg-base);
  position: relative;
  overflow: hidden;
}`);

// Check if Login.jsx or Dashboard.jsx have inline styles
fs.writeFileSync("src/index.css", css);
console.log("Fixed titles and boxes");

