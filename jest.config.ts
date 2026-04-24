import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: { module: "commonjs" } }],
  },
  globalSetup: "./__tests__/setup/globalSetup.ts",
  globalTeardown: "./__tests__/setup/globalTeardown.ts",
  testMatch: ["**/__tests__/**/*.test.ts"],
  testTimeout: 30000,
  // Load .env.test automatically when running tests
  setupFiles: ["<rootDir>/jest.env.ts"],
};

export default config;
