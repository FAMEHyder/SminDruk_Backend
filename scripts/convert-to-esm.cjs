/**
 * One-time migration script: converts Backend source files from CommonJS to ES modules.
 * Run with: node scripts/convert-to-esm.cjs
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

const getSourceFiles = (dir, files = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "scripts") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) getSourceFiles(full, files);
    else if (entry.name.endsWith(".js")) files.push(full);
  }
  return files;
};

const isRelative = (specifier) => specifier.startsWith(".");

const withJsExtension = (specifier) => {
  if (!isRelative(specifier)) return specifier;
  if (/\.(js|json|node)$/.test(specifier)) return specifier;
  return `${specifier}.js`;
};

const convertRequires = (content) => {
  const imports = [];
  let body = content;

  // dotenv.config()
  body = body.replace(/require\(["']dotenv["']\)\.config\(\);?\s*\n?/g, "");
  const usesDotenv = content.includes('require("dotenv")') || content.includes("require('dotenv')");
  if (usesDotenv) {
    imports.push('import dotenv from "dotenv";');
    imports.push("dotenv.config();");
  }

  // const Name = require("pkg").Prop;
  body = body.replace(
    /const\s+(\w+)\s*=\s*require\(["']([^"']+)["']\)\.(\w+)\s*;/g,
    (_m, name, mod, prop) => {
      imports.push(`import { ${prop} as ${name} } from "${withJsExtension(mod)}";`);
      return "";
    }
  );

  // const { a, b } = require("pkg");
  body = body.replace(/const\s+\{([^}]+)\}\s*=\s*require\(["']([^"']+)["']\)\s*;/g, (_m, names, mod) => {
    imports.push(`import { ${names.trim()} } from "${withJsExtension(mod)}";`);
    return "";
  });

  // const Name = require("pkg");
  body = body.replace(/const\s+(\w+)\s*=\s*require\(["']([^"']+)["']\)\s*;/g, (_m, name, mod) => {
    if (mod.includes("/controller/") || mod.includes("\\controller\\")) {
      imports.push(`import * as ${name} from "${withJsExtension(mod)}";`);
    } else {
      imports.push(`import ${name} from "${withJsExtension(mod)}";`);
    }
    return "";
  });

  // Remaining inline require(...) e.g. router.use("/auth", require("./auth.routes"))
  body = body.replace(/require\(["']([^"']+)["']\)/g, (_m, mod) => {
    const varName = mod
      .replace(/^\.\//, "")
      .replace(/\//g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "_")
      .replace(/_+/g, "_");
    const safeName = `__route_${varName}`;
    if (!imports.some((line) => line.includes(` ${safeName} `) || line.includes(` ${safeName} from`))) {
      imports.push(`import ${safeName} from "${withJsExtension(mod)}";`);
    }
    return safeName;
  });

  body = body.replace(/^\s*\n+/, "");
  return { imports, body };
};

const convertExports = (body) => {
  // module.exports = { a, b, c };
  body = body.replace(/module\.exports\s*=\s*\{([\s\S]*?)\}\s*;/g, (_m, exports) => {
    return `export { ${exports.trim()} };`;
  });

  // module.exports = identifier;
  body = body.replace(/module\.exports\s*=\s*(.+?)\s*;/g, "export default $1;");

  return body;
};

const addDirnameHelper = (content) => {
  if (!content.includes("__dirname") && !content.includes("__filename")) return content;

  const hasPathImport = /import\s+path\s+from\s+["']path["']/.test(content);
  const hasFileUrlImport = /import\s+\{\s*fileURLToPath\s*\}\s+from\s+["']url["']/.test(content);

  let helperLines = [];
  if (!hasFileUrlImport) helperLines.push('import { fileURLToPath } from "url";');
  if (!hasPathImport) helperLines.push('import path from "path";');
  helperLines.push("const __dirname = path.dirname(fileURLToPath(import.meta.url));");
  const helper = helperLines.join("\n");

  if (content.includes("dotenv.config();")) {
    return content.replace(/dotenv\.config\(\);\n/, `dotenv.config();\n${helper}\n`);
  }

  const importBlock = content.match(/^((?:import .+\n)+)/);
  if (importBlock) {
    return content.replace(importBlock[1], `${importBlock[1]}${helper}\n`);
  }

  return `${helper}\n${content}`;
};

const convertFile = (filePath) => {
  const original = fs.readFileSync(filePath, "utf8");
  if (!original.includes("require(") && !original.includes("module.exports")) return false;

  const { imports, body } = convertRequires(original);
  let converted = convertExports(body);

  if (imports.length) {
    converted = `${imports.join("\n")}\n\n${converted}`;
  }

  converted = addDirnameHelper(converted);

  fs.writeFileSync(filePath, converted, "utf8");
  return true;
};

const files = getSourceFiles(ROOT);
let count = 0;
for (const file of files) {
  if (convertFile(file)) {
    count++;
    console.log("converted:", path.relative(ROOT, file));
  }
}
console.log(`\nDone. Converted ${count} files.`);
