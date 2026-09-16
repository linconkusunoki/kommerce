const required = ["GEMINI_API_KEY", "RESEND_API_KEY"];
const missing = required.filter((name) => !process.env[name]?.trim());

if (missing.length > 0) {
  console.error(`Missing required environment variable(s): ${missing.join(", ")}`);
  process.exit(1);
}

console.log("Environment validation passed.");
