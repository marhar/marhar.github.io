const vm = require('vm');
const fs = require('fs');

// Create a shared context with browser-like globals
const context = vm.createContext({
    console,
    Math,
    Object,
    Array,
    Number,
    String,
    Error,
    Intl,
    document: {
        getElementById: () => ({ addEventListener: () => {}, value: '', innerHTML: '', classList: { add: () => {}, remove: () => {} }, style: {} }),
        querySelector: () => null,
        addEventListener: () => {}
    },
    window: {},
    Chart: function() { this.destroy = () => {}; }
});

// Load files in order
const sp500Data = fs.readFileSync('sp500_data.js', 'utf8');
const mortgageJs = fs.readFileSync('mortgage.js', 'utf8');
const appJs = fs.readFileSync('app.js', 'utf8');
const testsJs = fs.readFileSync('tests.js', 'utf8');

vm.runInContext(sp500Data, context);
vm.runInContext(mortgageJs, context);
vm.runInContext(appJs, context);
vm.runInContext(testsJs, context);

// Run tests
vm.runInContext('TestSuite.runAll()', context);
