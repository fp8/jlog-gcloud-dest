import type { Config } from "jest";

const config: Config = {
  collectCoverageFrom: ["src/**/*.ts"],
  coverageDirectory: "./coverage",
  moduleFileExtensions: ["js", "ts"],
  moduleNameMapper: {
    '^@proj$': '<rootDir>/src/',
    '^@proj/(.*)$': '<rootDir>/src/$1',
  },
  rootDir: ".",
  testEnvironment: "node",
  testMatch: ["**/test/*.spec.ts", "**/test/**/*.spec.ts"],
  transform: {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      {
        "ts-jest": {
          tsconfig: "./tsconfig.json",
        },
      },
    ],
  },
  verbose: true,
};

export default config;
