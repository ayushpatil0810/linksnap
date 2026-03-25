import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const db = drizzle(process.env.DATABASE_URL as string, { schema });

export { db };
export default db;
