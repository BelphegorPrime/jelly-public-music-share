import type { Config } from "drizzle-kit";
import { DATA_DIR } from "./config";

export default {
    schema: "./src/db/schema.ts",
    out: "./src/db/migrations",
    dialect: "sqlite",
    dbCredentials: {
        url: `${DATA_DIR}/data.sqlite`,
    },
} satisfies Config;