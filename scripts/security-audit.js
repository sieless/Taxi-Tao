#!/usr/bin/env node

/**
 * Taxi-Tao Web Security Audit Script
 *
 * Automated security linter that checks for antipatterns across the entire codebase.
 * Run with: node scripts/security-audit.js
 *
 * Exit codes:
 *   0 - No issues found
 *   1 - Critical or High issues found
 *   2 - Medium or Low issues found
 */

const fs = require("fs");
const path = require("path");

// ============================================================
// CONFIGURATION
// ============================================================

const ROOT_DIR = path.resolve(__dirname, "..");

const SEVERITY = {
  CRITICAL: "CRITICAL",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
  INFO: "INFO",
};

const findings = [];

function addFinding(severity, file, line, message) {
  findings.push({ severity, file, line, message });
}

// ============================================================
// FILE SCANNER
// ============================================================

function readFile(relPath) {
  const fullPath = path.join(ROOT_DIR, relPath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, "utf-8");
}

function findFiles(dir, extensions) {
  const results = [];
  const fullPath = path.join(ROOT_DIR, dir);
  if (!fs.existsSync(fullPath)) return results;

  const items = fs.readdirSync(fullPath, { withFileTypes: true });
  for (const item of items) {
    const itemPath = path.join(dir, item.name);
    if (item.isDirectory() && !item.name.startsWith(".") && item.name !== "node_modules" && item.name !== ".next" && item.name !== "_legacy_backup") {
      results.push(...findFiles(itemPath, extensions));
    } else if (item.isFile() && extensions.some((ext) => item.name.endsWith(ext))) {
      results.push(itemPath);
    }
  }
  return results;
}

function scanFile(relPath, content) {
  const lines = content.split("\n");

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // Skip comments (rough check)
    if (line.trim().startsWith("//") || line.trim().startsWith("*") || line.trim().startsWith("/*")) return;

    // ---- CRITICAL FINDINGS ----

    // C1: Service account files
    if (relPath.includes("service-account") || relPath.includes("firebase-admin")) {
      if (line.includes('"private_key"') || line.includes('"type": "service_account"')) {
        addFinding(SEVERITY.CRITICAL, relPath, lineNum, "Firebase service account key found in repository");
      }
    }

    // C2: Duplicate match blocks (check in firestore.rules)
    if (relPath === "firestore.rules") {
      if (line.includes("match /notifications/")) {
        const prevLines = lines.slice(0, idx);
        const prevMatches = prevLines.filter((l) => l.includes("match /notifications/")).length;
        if (prevMatches > 0) {
          addFinding(SEVERITY.CRITICAL, relPath, lineNum, "Duplicate match block for /notifications -- last one silently wins");
        }
      }
      if (line.includes("match /driverNotifications/")) {
        const prevLines = lines.slice(0, idx);
        const prevMatches = prevLines.filter((l) => l.includes("match /driverNotifications/")).length;
        if (prevMatches > 0) {
          addFinding(SEVERITY.CRITICAL, relPath, lineNum, "Duplicate match block for /driverNotifications -- last one silently wins");
        }
      }
      if (line.includes("match /app_crashes/")) {
        const prevLines = lines.slice(0, idx);
        const prevMatches = prevLines.filter((l) => l.includes("match /app_crashes/")).length;
        if (prevMatches > 0) {
          addFinding(SEVERITY.CRITICAL, relPath, lineNum, "Duplicate match block for /app_crashes -- last one silently wins");
        }
      }
      // C5: Duplicate companies match block
      if (line.includes("match /companies/")) {
        const prevLines = lines.slice(0, idx);
        const prevMatches = prevLines.filter((l) => l.includes("match /companies/")).length;
        if (prevMatches > 0) {
          addFinding(SEVERITY.HIGH, relPath, lineNum, "Duplicate match block for /companies -- last one silently wins");
        }
      }
    }

    // C3: allow create: if true
    if (relPath === "firestore.rules") {
      if (/allow\s+(create|read,\s*write|write)\s*:\s*if\s+true/.test(line)) {
        addFinding(SEVERITY.CRITICAL, relPath, lineNum, "Firestore rule allows unauthenticated/unrestricted access");
      }
    }

    // ---- HIGH FINDINGS ----

    // H1: Math.random() in security-sensitive contexts
    if (/\bMath\.random\(\)/.test(line)) {
      const securityContext = relPath.includes("invite") || relPath.includes("staff") ||
        relPath.includes("password") || relPath.includes("token") || relPath.includes("receipt") ||
        relPath.includes("invoice") || relPath.includes("payment") || relPath.includes("audit") ||
        relPath.includes("booking") || relPath.includes("HireRequest");
      if (securityContext || line.includes("token") || line.includes("password") || line.includes("receipt") || line.includes("invoice")) {
        addFinding(SEVERITY.HIGH, relPath, lineNum, "Math.random() used for security-sensitive value -- use crypto.randomUUID()");
      }
    }

    // H2: localStorage for sensitive data
    if (/localStorage\.setItem\s*\(\s*["']userProfile["']/.test(line) ||
        /localStorage\.setItem\s*\(\s*["']driverProfile["']/.test(line) ||
        /localStorage\.setItem\s*\(\s*["']companyProfile["']/.test(line)) {
      addFinding(SEVERITY.HIGH, relPath, lineNum, "Sensitive profile stored in localStorage (XSS-vulnerable) -- use React state");
    }

    // H3: document.cookie for session cookies
    if (/document\.cookie\s*=/.test(line) && (line.includes("session") || line.includes("firebase-auth-token"))) {
      addFinding(SEVERITY.HIGH, relPath, lineNum, "Session cookie set via document.cookie (no httpOnly) -- use server-side Set-Cookie");
    }

    // H4: dangerouslySetInnerHTML without DOMPurify
    if (/dangerouslySetInnerHTML/.test(line)) {
      // Search entire file content for DOMPurify import/usage (import may be far above)
      const hasDOMPurify = content.includes("DOMPurify") || content.includes("sanitize");
      if (!hasDOMPurify) {
        addFinding(SEVERITY.HIGH, relPath, lineNum, "dangerouslySetInnerHTML used without DOMPurify sanitization");
      }
    }

    // H5: NEXT_PUBLIC_ for server secrets
    if (/NEXT_PUBLIC_MAIN_ADMIN/.test(line)) {
      addFinding(SEVERITY.HIGH, relPath, lineNum, "Admin email exposed via NEXT_PUBLIC_ prefix (visible in browser bundle)");
    }

    // H6: Wildcard CORS
    if (line.includes('"*"') && relPath.includes("cors")) {
      addFinding(SEVERITY.HIGH, relPath, lineNum, "Wildcard CORS origin allows all domains -- restrict to your domains");
    }

    // H7: Client SDK Firestore writes to hirePayments
    if (relPath.includes("hire-payment") && /runTransaction|updateDoc|setDoc/.test(line) &&
        !relPath.includes("node_modules")) {
      if (/hirePayments|HIRE_PAYMENTS/.test(line)) {
        addFinding(SEVERITY.HIGH, relPath, lineNum, "Client SDK write to hirePayments blocked by Firestore rules -- use Cloud Functions");
      }
    }

    // H8: Session cookie trusts plain UID
    if (relPath.includes("auth-server") && /const uid = sessionCookie/.test(line)) {
      addFinding(SEVERITY.CRITICAL, relPath, lineNum, "Session cookie trusts plain UID without Firebase Auth verification");
    }

    // H9: Admin SDK in client component (check for "use client" directive at start of line)
    if (line.includes("firebase-admin")) {
      const hasUseClientDirective = lines.some((l, i) => {
        const trimmed = l.trim();
        return (trimmed === '"use client"' || trimmed === "'use client'") && !trimmed.startsWith("//");
      });
      if (hasUseClientDirective) {
        addFinding(SEVERITY.CRITICAL, relPath, lineNum, "Firebase Admin SDK imported in client component -- exposes private key");
      }
    }

    // ---- MEDIUM FINDINGS ----

    // M1: console.log with sensitive patterns
    if (/console\.(log|warn|error|info)\s*\(/.test(line)) {
      if (/\.uid|\.email|token|apiKey|password|secret|credential/i.test(line)) {
        addFinding(SEVERITY.MEDIUM, relPath, lineNum, "console.log may leak sensitive data (UID, token, email) -- strip in production");
      }
    }

    // M2: Regex HTML sanitization
    if (/\.replace\s*\(\s*\/<script/i.test(line) || /\.replace\s*\(\s*\/javascript:/i.test(line)) {
      addFinding(SEVERITY.MEDIUM, relPath, lineNum, "Regex-based HTML sanitization is insufficient -- use DOMPurify");
    }

    // M3: Unused isNotSuspended helper
    if (relPath === "firestore.rules" && /function isNotSuspended/.test(line)) {
      const fullContent = content;
      const usageCount = (fullContent.match(/\bisNotSuspended\(\)/g) || []).length;
      if (usageCount === 1) { // Only the definition
        addFinding(SEVERITY.MEDIUM, relPath, lineNum, "isNotSuspended() defined but never used in rules");
      }
    }

    // M4: getUserData() without exists() guard
    if (relPath === "firestore.rules" && /getUserData\(\)/.test(line)) {
      // Skip the getUserData() function definition itself
      if (/function getUserData/.test(line)) return;
      // Check if getUserData() definition has self-guard (hasUserData or exists inside)
      const getUserDefIdx = lines.findIndex((l) => /function getUserData\(\)/.test(l));
      if (getUserDefIdx >= 0) {
        const defBody = lines.slice(getUserDefIdx, getUserDefIdx + 5).join(" ");
        if (/hasUserData\(\)|exists\(/.test(defBody)) return; // Self-guarding
      }
      const prevLine = idx > 0 ? lines[idx - 1] : "";
      const hasExistsGuard = prevLine.includes("exists(") || prevLine.includes("hasUserData(") || line.includes("exists(");
      if (!hasExistsGuard) {
        addFinding(SEVERITY.MEDIUM, relPath, lineNum, "getUserData() called without exists() guard -- may throw if user doc missing");
      }
    }

    // M5: eval() or Function() constructor
    if (/\beval\s*\(/.test(line) || /\bnew\s+Function\s*\(/.test(line)) {
      addFinding(SEVERITY.HIGH, relPath, lineNum, "eval() or new Function() detected -- code injection risk");
    }

    // M6: HTTP URLs (not HTTPS)
    if (/fetch\s*\(\s*["']http:\/\//.test(line) && !line.includes("localhost")) {
      addFinding(SEVERITY.MEDIUM, relPath, lineNum, "HTTP (not HTTPS) URL in fetch call -- use HTTPS in production");
    }

    // M7: Missing httpOnly on cookie
    if (/setCookie|Set-Cookie|cookie.*=.*/.test(line) && !line.includes("httpOnly") && !line.includes("document.cookie")) {
      if (line.includes("session") || line.includes("auth")) {
        addFinding(SEVERITY.MEDIUM, relPath, lineNum, "Cookie set without httpOnly flag -- session may be XSS-accessible");
      }
    }

    // M8: TEMPORARY rules in firestore
    if (relPath === "firestore.rules" && /TEMPORARY/.test(line)) {
      addFinding(SEVERITY.MEDIUM, relPath, lineNum, "TEMPORARY rule found -- restrict to admin-only or remove before production");
    }
  });
}

// ============================================================
// SECRETS SCANNER
// ============================================================

function scanForSecrets() {
  const envFile = readFile(".env.local");
  if (envFile) {
    const lines = envFile.split("\n");
    lines.forEach((line, idx) => {
      if (line.trim().startsWith("#") || !line.includes("=")) return;
      const [key] = line.split("=");
      if (key && !key.startsWith("NEXT_PUBLIC_")) {
        // Server-only secrets should not be in .env for production
        // (Vercel uses env vars, not .env files)
      }
    });
  }

  // Check .gitignore covers secrets
  const gitignore = readFile(".gitignore");
  if (gitignore) {
    const required = [".env*", "service-account", "credentials", "scratch"];
    for (const pattern of required) {
      if (!gitignore.includes(pattern)) {
        addFinding(SEVERITY.HIGH, ".gitignore", 0, `.gitignore missing pattern: ${pattern}`);
      }
    }
  }
}

// ============================================================
// CORS SCANNER
// ============================================================

function scanCORS() {
  const corsFile = readFile("cors.json");
  if (corsFile) {
    try {
      const cors = JSON.parse(corsFile);
      if (Array.isArray(cors)) {
        for (const rule of cors) {
          if (rule.origin && rule.origin.includes("*")) {
            addFinding(SEVERITY.HIGH, "cors.json", 1, "Wildcard CORS origin allows all domains");
          }
        }
      }
    } catch (e) {
      // Not valid JSON
    }
  }
}

// ============================================================
// NEXT.CONFIG SCANNER
// ============================================================

function scanNextConfig() {
  const config = readFile("next.config.ts");
  if (config) {
    if (!config.includes("Content-Security-Policy")) {
      addFinding(SEVERITY.HIGH, "next.config.ts", 0, "Missing Content-Security-Policy header -- add CSP with nonce-based script-src");
    }
    if (!config.includes("X-Frame-Options")) {
      addFinding(SEVERITY.MEDIUM, "next.config.ts", 0, "Missing X-Frame-Options header");
    }
    if (!config.includes("Strict-Transport-Security")) {
      addFinding(SEVERITY.MEDIUM, "next.config.ts", 0, "Missing HSTS header for production");
    }
  }
}

// ============================================================
// SCRATCH FOLDER SCANNER
// ============================================================

function scanScratchFolder() {
  const scratchPath = path.join(ROOT_DIR, "scratch");
  if (fs.existsSync(scratchPath)) {
    const scratchFiles = findFiles("scratch", [".ts", ".js", ".json"]);
    if (scratchFiles.length > 0) {
      addFinding(SEVERITY.HIGH, "scratch/", 0, `scratch/ folder contains ${scratchFiles.length} files with potential hardcoded secrets -- add to .gitignore and never commit`);
    }
  }
}

// ============================================================
// PACKAGE.JSON SCANNER
// ============================================================

function scanPackageJson() {
  const pkg = readFile("package.json");
  if (pkg) {
    try {
      const config = JSON.parse(pkg);

      // Check for firebase-admin in client dependencies (should be server-only)
      if (config.dependencies && config.dependencies["firebase-admin"]) {
        addFinding(SEVERITY.MEDIUM, "package.json", 0, "firebase-admin in dependencies -- ensure it's only used server-side");
      }

      // Check for security audit script
      if (!config.scripts || !config.scripts["security:audit"]) {
        addFinding(SEVERITY.LOW, "package.json", 0, "Missing security:audit script -- add: \"security:audit\": \"node scripts/security-audit.js\"");
      }
    } catch (e) {
      // Not valid JSON
    }
  }
}

// ============================================================
// MAIN
// ============================================================

function main() {
  console.log("Taxi-Tao Web Security Audit");
  console.log("============================\n");

  // Scan all relevant files
  const tsFiles = findFiles("lib", [".ts", ".tsx"]);
  const appFiles = findFiles("app", [".ts", ".tsx"]);
  const componentFiles = findFiles("components", [".ts", ".tsx"]);
  const allFiles = [...tsFiles, ...appFiles, ...componentFiles];

  // Add firestore.rules
  if (fs.existsSync(path.join(ROOT_DIR, "firestore.rules"))) {
    allFiles.push("firestore.rules");
  }

  // Scan files
  for (const relPath of allFiles) {
    const content = readFile(relPath);
    if (content) {
      scanFile(relPath, content);
    }
  }

  // Additional scans
  scanForSecrets();
  scanCORS();
  scanNextConfig();
  scanScratchFolder();
  scanPackageJson();

  // Sort findings by severity
  const severityOrder = {
    [SEVERITY.CRITICAL]: 0,
    [SEVERITY.HIGH]: 1,
    [SEVERITY.MEDIUM]: 2,
    [SEVERITY.LOW]: 3,
    [SEVERITY.INFO]: 4,
  };
  findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Print findings
  if (findings.length === 0) {
    console.log("No security issues found.\n");
    process.exit(0);
  }

  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };

  for (const f of findings) {
    counts[f.severity]++;
    const lineStr = f.line > 0 ? `:${f.line}` : "";
    console.log(`[${f.severity}] ${f.file}${lineStr} - ${f.message}`);
  }

  console.log(`\nSummary: ${counts.CRITICAL} CRITICAL, ${counts.HIGH} HIGH, ${counts.MEDIUM} MEDIUM, ${counts.LOW} LOW\n`);

  // Exit code based on severity
  if (counts.CRITICAL > 0 || counts.HIGH > 0) {
    process.exit(1);
  }
  if (counts.MEDIUM > 0 || counts.LOW > 0) {
    process.exit(2);
  }
  process.exit(0);
}

main();