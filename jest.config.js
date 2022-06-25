const path = require('path');

module.exports = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  globals: {
    NODE_ENV: 'test',
  },
  clearMocks: true,
  verbose: true,
  testEnvironment: 'node',
  coverageReporters: ['json', 'text', 'lcov', 'clover'],
  coveragePathIgnorePatterns: ['/node_modules/', path.join(__dirname, 'build')],
  testMatch: [
    path.join(__dirname, 'tests/**/*.test.ts'),
    path.join(__dirname, 'src/**/*.test.ts'),
  ],
  rootDir: __dirname,
  moduleDirectories: ['node_modules', 'src'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
