
import fs from "fs";
let css = fs.readFileSync("src/index.css", "utf8");

css = css.replace(/\.login-bg\s*\{[\s\S]*?\}/, ".login-bg { display: none; }");
css = css.replace(/\.login-page\s*\{[\s\S]*?\}/, `.login-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--bg-base);
}`);
// Same for .layout-main background gradient if it exists
css = css.replace(/body\s*\{[\s\S]*?background:.*?linear-gradient[\s\S]*?\}/, "");

fs.writeFileSync("src/index.css", css);
console.log("Fixed login-bg");

