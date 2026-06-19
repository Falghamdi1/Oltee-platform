import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      tsconfig: {
        strict: true,
        moduleResolution: "node",
        esModuleInterop: true,
      },
    }],
  },
  testMatch: ["**/__tests__/**/*.test.ts"],
  collectCoverageFrom: [
    "lib/engine.ts",
    "lib/scores.ts",
    "lib/montecarlo.ts",
    "lib/scenarios.ts",
    "lib/reducer.ts",
    "lib/validation.ts",
  ],
};

export default config;
