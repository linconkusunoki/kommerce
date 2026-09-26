import { migrate, getDb } from "../src/db/schema.ts";

const db = getDb();
await migrate(db);
await db.close();
