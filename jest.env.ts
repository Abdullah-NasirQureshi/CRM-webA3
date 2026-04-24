import { config } from "dotenv";
import { resolve } from "path";

// Load .env.test if it exists, fall back to .env
config({ path: resolve(__dirname, ".env.test") });
config({ path: resolve(__dirname, ".env") });
