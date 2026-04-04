/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/__tests__"],
  testMatch: ["**/*.test.ts"],
  moduleNameMapper: {
    "^@configs/(.*)$": "<rootDir>/configs/$1",
    "^@jobs/(.*)$": "<rootDir>/app/jobs/$1",
    "^@mailers/(.*)$": "<rootDir>/app/mailers/$1",
    "^@validators/(.*)$": "<rootDir>/app/validators/$1",
    "^ts-rails/(.*)$": "<rootDir>/rails/$1",
    "^@models$": "<rootDir>/app/models",
    "^@middlewares/(.*)$": "<rootDir>/app/middlewares/$1",
    "^@controllers/(.*)$": "<rootDir>/app/controllers/$1",
    "^@services/(.*)$": "<rootDir>/app/services/$1",
    "^@routes/(.*)$": "<rootDir>/configs/routes/$1",
  },
};
