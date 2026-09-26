import { seed } from "../src/db/seed.ts";
import { db } from "../src/db/client.ts";
import { getDb } from "../src/db/schema.ts";

getDb();
await seed();
await db.close();
