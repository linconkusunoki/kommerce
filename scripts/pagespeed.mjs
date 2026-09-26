import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const url = process.argv[2] ?? "https://kommerce-ilye.onrender.com/";
const outputDir = process.argv[3] ?? "reports/pagespeed";
const categories = ["performance", "accessibility", "best-practices", "seo"];
const apiKey = process.env.PAGESPEED_API_KEY;

await mkdir(outputDir, { recursive: true });

for (const strategy of ["mobile", "desktop"]) {
  const params = new URLSearchParams({ url, strategy });
  for (const category of categories) params.append("category", category);
  if (apiKey) params.set("key", apiKey);

  const response = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`);
  if (!response.ok) {
    const hint = response.status === 429 ? " Set PAGESPEED_API_KEY to use an authenticated quota." : "";
    throw new Error(`PageSpeed ${strategy} request failed: ${response.status} ${response.statusText}.${hint}`);
  }

  const report = await response.json();
  const filename = join(outputDir, `${strategy}.json`);
  await writeFile(filename, JSON.stringify(report, null, 2));

  const scores = Object.fromEntries(
    Object.entries(report.lighthouseResult?.categories ?? {}).map(([name, category]) => [name, category.score * 100]),
  );
  console.log(`${strategy}: ${JSON.stringify(scores)} -> ${filename}`);
}
