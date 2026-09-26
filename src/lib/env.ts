export function validateEnv() {
  const databaseVariables = ["DATABASE_HOST", "DATABASE_PORT", "DATABASE_NAME", "DATABASE_USER", "DATABASE_PASSWORD"];
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
  const missing = ["GEMINI_API_KEY"].filter((name) => !process.env[name]?.trim());

  if (!hasDatabaseUrl) {
    missing.push(...databaseVariables.filter((name) => !process.env[name]?.trim()));
  }

  const s3 = {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.S3_REGION || process.env.AWS_REGION,
    bucket: process.env.S3_BUCKET,
    publicUrl: process.env.S3_PUBLIC_URL,
  };

  const s3Configured = [s3.accessKeyId, s3.secretAccessKey, s3.bucket, s3.publicUrl].some((value) => value?.trim());
  if (s3Configured) {
    missing.push(
      ...Object.entries(s3)
        .filter(([name]) => name !== "region")
        .filter(([, value]) => !value?.trim())
        .map(([name]) => `S3 ${name}`),
    );
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variable(s): ${missing.join(", ")}`);
  }
}
