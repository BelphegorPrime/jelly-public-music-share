import type { Config } from "drizzle-kit";
import { DATA_DIR } from "./config";

export default {
    schema: "./src/db/schema/index.ts",
    out: "./src/db/migrations",
    dialect: "sqlite",
    dbCredentials: {
        url: `${DATA_DIR}/app.sqlite`,
    },
} satisfies Config;