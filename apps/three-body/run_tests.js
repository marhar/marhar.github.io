#!/usr/bin/env node
/**
 * Three Body Problem - Test Runner
 * Run with: node run_tests.js
 */

const { TestSuite } = require('./tests.js');

const results = TestSuite.runAll();

// Exit with error code if any tests failed
process.exit(results.failed > 0 ? 1 : 0);
