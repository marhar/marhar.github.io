#!/usr/bin/env node
// Test runner for mortgage-payoff calculator

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Read and execute files in order
const files = [
    'sp500_data.js',
    'app.js',
    'tests.js'
];

const context = {
    console,
    module: { exports: {} },
    Math,
    Object,
    Array,
    String,
    Number,
    parseFloat,
    parseInt,
    document: null,  // Will cause errors if UI code runs
    Chart: null,
    global: {}  // For tests to attach to
};

vm.createContext(context);

files.forEach(file => {
    const filePath = path.join(__dirname, file);
    const code = fs.readFileSync(filePath, 'utf8');
    try {
        vm.runInContext(code, context);
    } catch (e) {
        // Ignore errors from UI code that needs document
        if (!e.message.includes('document') && !e.message.includes('addEventListener')) {
            throw e;
        }
    }
});

// Run tests
const testsObj = context.global.tests || context.tests;
const success = testsObj.runAll();
process.exit(success ? 0 : 1);
