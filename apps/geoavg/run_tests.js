#!/usr/bin/env node
/**
 * Geographic Center Calculator - Test Runner
 * Run with: node run_tests.js
 */

const { TestSuite } = require('./tests.js');

const results = TestSuite.runAll();

// Exit with error code if any tests failed
process.exit(results.failed > 0 ? 1 : 0);
