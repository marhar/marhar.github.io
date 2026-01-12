#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');

const sp500 = fs.readFileSync('sp500_data.js', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');

const context = {
    console, Math, Object, Array, parseFloat, parseInt,
    document: { addEventListener: () => {}, getElementById: () => ({}) }
};
vm.createContext(context);
vm.runInContext(sp500, context);
try { vm.runInContext(app, context); } catch(e) {}

// Test Model 1 (Drawdown)
console.log('=== MODEL 1: DRAWDOWN ===');
console.log('Year | Invest Final | Payoff Final | Winner');
console.log('-----|--------------|--------------|-------');

const years = [1950, 1970, 1990];
for (const year of years) {
    const result = context.compareScenarios(300000, 0.06, 30, year, 'drawdown');
    if (result && !result.error) {
        const investStr = result.invest.failed ? 'FAILED' : Math.round(result.invest.finalValue).toLocaleString();
        console.log(year, '|', investStr.padStart(12), '|', Math.round(result.payoff.finalValue).toLocaleString().padStart(12), '|', result.winner.toUpperCase());
    }
}

const hist1 = context.runHistoricalAnalysis(300000, 0.06, 30, 'drawdown');
console.log('');
console.log('Summary: Invest wins', hist1.summary.investWins, 'of', hist1.summary.totalYears, '(' + hist1.summary.investWinRate + '%)');
console.log('Failures:', hist1.summary.failures);

// Test Model 2 (Separate Income)
console.log('');
console.log('=== MODEL 2: SEPARATE INCOME ===');
console.log('Year | Invest Final | Payoff Final | Winner');
console.log('-----|--------------|--------------|-------');

for (const year of years) {
    const result = context.compareScenarios(300000, 0.06, 30, year, 'separate');
    if (result && !result.error) {
        console.log(year, '|', Math.round(result.invest.finalValue).toLocaleString().padStart(12), '|', Math.round(result.payoff.finalValue).toLocaleString().padStart(12), '|', result.winner.toUpperCase());
    }
}

const hist2 = context.runHistoricalAnalysis(300000, 0.06, 30, 'separate');
console.log('');
console.log('Summary: Invest wins', hist2.summary.investWins, 'of', hist2.summary.totalYears, '(' + hist2.summary.investWinRate + '%)');
console.log('Failures:', hist2.summary.failures);
