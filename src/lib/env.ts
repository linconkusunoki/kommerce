export function validateEnv() {
  const required = ["DATABASE_URL", "GEMINI_API_KEY"];
  const missing = required.filter((name) => !process.env[name]?.trim());

  const s3 = {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.S3_REGION || process.env.AWS_REGION,
    bucket: process.env.S3_BUCKET,
    publicUrl: process.env.S3_PUBLIC_URL,
  };

  if (Object.values(s3).some((value) => value?.trim())) {
    missing.push(
      ...Object.entries(s3)
        .filter(([, value]) => !value?.trim())
        .map(([name]) => `S3 ${name}`),
    );
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variable(s): ${missing.join(", ")}`);
  }
}
