
import fs from "fs";
let css = fs.readFileSync("src/index.css", "utf8");

const newRoot = `:root {
  --bg-base:         #f8fafc;
  --bg-surface:      #ffffff;
  --bg-card:         #ffffff;
  --bg-card-hover:   #f1f5f9;
  --border:          #e2e8f0;
  --border-hover:    #cbd5e1;

  --text-primary:    #0f172a;
  --text-secondary:  #475569;
  --text-muted:      #94a3b8;

  --brand:           #2563eb;
  --brand-dark:      #1d4ed8;
  --brand-light:     #60a5fa;
  --brand-glow:      rgba(37, 99, 235, 0.15);

  --purple:          #4f46e5;
  --purple-dark:     #4338ca;
  --purple-glow:     rgba(79, 70, 229, 0.1);

  --green:           #10b981;
  --green-dark:      #059669;
  --green-bg:        rgba(16, 185, 129, 0.12);
  --yellow:          #f59e0b;
  --yellow-bg:       rgba(245, 158, 11, 0.12);
  --blue:            #3b82f6;
  --blue-bg:         rgba(59, 130, 246, 0.12);
  --red:             #ef4444;
  --red-dark:        #dc2626;
  --red-bg:          rgba(239, 68, 68, 0.12);
  --orange:          #f97316;
  --orange-bg:       rgba(249, 115, 22, 0.12);

  --sidebar-w:          260px;
  --sidebar-collapsed:  72px;

  --r-xs:  4px;
  --r-sm:  6px;
  --r-md:  8px;
  --r-lg:  12px;
  --r-xl:  16px;
  --r-2xl: 20px;

  --shadow:       0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  --shadow-sm:    0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-glow:  0 0 0 3px var(--brand-glow);
  --shadow-card:  0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.05);

  --transition:   0.2s ease-in-out;
  --transition-slow: 0.3s ease-in-out;
}`;

css = css.replace(/:root\s*\{[\s\S]*?--transition-slow:[^}]+\}/, newRoot);

css = css.replace(/background:\s*linear-gradient\([^)]+\);/g, "background: var(--brand); /* flattened */");
css = css.replace(/-webkit-text-fill-color:\s*transparent;/g, "color: var(--text-primary);");
css = css.replace(/background-clip:\s*text;/g, "color: var(--text-primary);");
css = css.replace(/-webkit-background-clip:\s*text;/g, "color: var(--text-primary);");

css = css.replace(/\.sidebar\s*\{[\s\S]*?\}/, `.sidebar {
  width: var(--sidebar-w);
  background: var(--bg-surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-slow);
  overflow: hidden;
  flex-shrink: 0;
}`);

css = css.replace(/\.topbar\s*\{[\s\S]*?\}/, `.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  position: relative;
}`);

css = css.replace(/\.card\s*\{[\s\S]*?\}/, `.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-xl);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition);
  position: relative;
  overflow: hidden;
}`);

css = css.replace(/\.login-wrapper\s*\{[\s\S]*?\}/, `.login-wrapper {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--bg-base);
  position: relative;
  overflow: hidden;
}`);

css = css.replace(/\.login-blob-1,\s*\.login-blob-2\s*\{[\s\S]*?\}/, ".login-blob-1, .login-blob-2 { display: none; }");
css = css.replace(/\.login-box\s*\{[\s\S]*?\}/, `.login-box {
  width: 100%;
  max-width: 440px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--r-xl);
  padding: 2.5rem;
  box-shadow: var(--shadow);
  position: relative;
  z-index: 10;
}`);

css = css.replace(/\.form-input\s*\{[\s\S]*?\}/, `.form-input {
  width: 100%;
  padding: 10px 14px 10px 42px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  color: var(--text-primary);
  font-size: 0.9rem;
  font-family: inherit;
  transition: all var(--transition);
  outline: none;
}`);

css = css.replace(/\.form-input:focus\s*\{[\s\S]*?\}/, `.form-input:focus {
  border-color: var(--brand);
  background: var(--bg-surface);
  box-shadow: var(--shadow-glow);
}`);

fs.writeFileSync("src/index.css", css);
console.log("Rewrote CSS theme completely.");

