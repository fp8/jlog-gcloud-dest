import config from './jest.config';

config.moduleNameMapper = {
  '^@proj$': '<rootDir>/lib',
  '^@proj/(.*)$': '<rootDir>/lib/$1',
};

config.transform = {
  "^.+\\.(t|j)s$": [
    "ts-jest",
    {
      "ts-jest": {
        tsconfig: "./tsconfig.testlib.json",
      },
    },
  ],
};

config.transformIgnorePatterns = [
  "<rootDir>/lib/.*\\.js$"
];

export default config;
