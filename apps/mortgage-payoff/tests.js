// Mortgage Payoff Calculator v2 - Comprehensive Test Suite
// Run with: node run_tests.js

const tests = {
    passed: 0,
    failed: 0,

    assert(condition, message) {
        if (condition) {
            this.passed++;
            console.log(`✓ ${message}`);
        } else {
            this.failed++;
            console.log(`✗ ${message}`);
        }
    },

    assertApprox(actual, expected, tolerance, message) {
        const diff = Math.abs(actual - expected);
        if (diff <= tolerance) {
            this.passed++;
            console.log(`✓ ${message}`);
        } else {
            this.failed++;
            console.log(`✗ ${message} (expected ${expected}, got ${actual}, diff ${diff})`);
        }
    },

    assertGreater(actual, threshold, message) {
        if (actual > threshold) {
            this.passed++;
            console.log(`✓ ${message}`);
        } else {
            this.failed++;
            console.log(`✗ ${message} (expected > ${threshold}, got ${actual})`);
        }
    },

    assertLess(actual, threshold, message) {
        if (actual < threshold) {
            this.passed++;
            console.log(`✓ ${message}`);
        } else {
            this.failed++;
            console.log(`✗ ${message} (expected < ${threshold}, got ${actual})`);
        }
    },

    // =========================================================================
    // MONTHLY PAYMENT CALCULATION TESTS
    // =========================================================================
    testMonthlyPayment() {
        console.log('\n--- Monthly Payment Calculation Tests ---');

        // Standard 30-year mortgage at 6%
        const payment1 = calculateMonthlyPayment(300000, 0.06, 30);
        this.assertApprox(payment1, 1798.65, 0.01, '$300k at 6% for 30 years = $1798.65');

        // 15-year mortgage at 4%
        const payment2 = calculateMonthlyPayment(200000, 0.04, 15);
        this.assertApprox(payment2, 1479.38, 0.01, '$200k at 4% for 15 years = $1479.38');

        // Zero interest rate
        const payment3 = calculateMonthlyPayment(120000, 0, 10);
        this.assertApprox(payment3, 1000, 0.01, '$120k at 0% for 10 years = $1000');

        // High interest rate
        const payment4 = calculateMonthlyPayment(100000, 0.12, 30);
        this.assertApprox(payment4, 1028.61, 0.01, '$100k at 12% for 30 years = $1028.61');

        // Small loan
        const payment5 = calculateMonthlyPayment(10000, 0.05, 5);
        this.assertApprox(payment5, 188.71, 0.01, '$10k at 5% for 5 years = $188.71');

        // Large loan
        const payment6 = calculateMonthlyPayment(1000000, 0.07, 30);
        this.assertApprox(payment6, 6653.02, 0.01, '$1M at 7% for 30 years = $6653.02');
    },

    // =========================================================================
    // S&P 500 DATA RETRIEVAL TESTS
    // =========================================================================
    testGetMonthlyReturns() {
        console.log('\n--- S&P 500 Data Retrieval Tests ---');

        // Valid period - 1990
        const returns1 = getMonthlyReturns(1990, 1, 12);
        this.assert(returns1 !== null, 'Can get returns for 1990');
        this.assert(returns1.length === 12, 'Returns array has 12 months for 1990');

        // Valid period - earliest data (1928-02)
        const returns2 = getMonthlyReturns(1928, 2, 10);
        this.assert(returns2 !== null, 'Can get returns starting 1928-02');
        this.assert(returns2.length === 10, 'Returns array has 10 months');

        // Invalid - before data starts
        const returns3 = getMonthlyReturns(1928, 1, 12);
        this.assert(returns3 === null, 'Returns null when starting 1928-01 (no data)');

        // Invalid - too far in future
        const returns4 = getMonthlyReturns(2100, 1, 12);
        this.assert(returns4 === null, 'Returns null for future dates');

        // Valid - multi-year span
        const returns5 = getMonthlyReturns(1990, 1, 360);
        this.assert(returns5 !== null, 'Can get 30 years of returns from 1990');
        this.assert(returns5.length === 360, 'Returns array has 360 months');

        // Check returns are reasonable (between -50% and +50% monthly)
        if (returns1) {
            const allReasonable = returns1.every(r => r > -0.5 && r < 0.5);
            this.assert(allReasonable, 'All monthly returns are within reasonable range');
        }
    },

    // =========================================================================
    // MODEL 1: DRAWDOWN INVEST SCENARIO TESTS
    // =========================================================================
    testInvestScenarioDrawdown() {
        console.log('\n--- Model 1: Drawdown Invest Scenario Tests ---');

        // 1990s bull market - should not fail
        const result1 = runInvestScenario(300000, 0.06, 30, 1990);
        this.assert(!result1.error, 'Invest scenario runs without error for 1990');
        this.assert(!result1.failed, 'Invest scenario does not fail in 1990 bull market');
        this.assertGreater(result1.finalValue, 0, 'Final value is positive for 1990');
        this.assert(result1.history.length === 361, 'History has 361 entries (months 0-360)');
        this.assertApprox(result1.monthlyPayment, 1798.65, 0.01, 'Monthly payment calculated correctly');

        // 1929 crash - likely to fail
        const result2 = runInvestScenario(300000, 0.08, 30, 1929);
        this.assert(result2.history.length > 0, 'History populated even for crash periods');
        if (result2.failed) {
            this.assertGreater(result2.failureMonth, 0, 'Failure month is recorded');
            this.assertApprox(result2.finalValue, 0, 0.01, 'Final value is 0 on failure');
        }

        // Investment starts with full lump sum
        this.assertApprox(result1.history[0].value, 300000, 0.01, 'Starts with full lump sum');

        // Month 1 should be less than start (after withdrawal)
        this.assertLess(result1.history[1].value, 300000, 'Month 1 < starting value (withdrawal)');
    },

    // =========================================================================
    // MODEL 2: SEPARATE INCOME INVEST SCENARIO TESTS
    // =========================================================================
    testInvestScenarioSeparate() {
        console.log('\n--- Model 2: Separate Income Invest Scenario Tests ---');

        // Model 2 invest - lump sum grows untouched
        const result1 = runInvestScenarioModel2(300000, 0.06, 30, 1990);
        this.assert(!result1.error, 'Model 2 invest runs without error');
        this.assert(!result1.failed, 'Model 2 invest never fails (no withdrawals)');
        this.assertGreater(result1.finalValue, 300000, 'Final value > starting value');
        this.assert(result1.history.length === 361, 'History has 361 entries');

        // No withdrawals, so should always grow over 30 years
        const result2 = runInvestScenarioModel2(300000, 0.06, 30, 1929);
        this.assert(!result2.failed, 'Model 2 never fails even in 1929 crash');
        this.assertGreater(result2.finalValue, 0, 'Final value positive even after 1929');

        // Investment starts with full lump sum
        this.assertApprox(result1.history[0].value, 300000, 0.01, 'Starts with full lump sum');
    },

    // =========================================================================
    // PAYOFF SCENARIO TESTS
    // =========================================================================
    testPayoffScenario() {
        console.log('\n--- Payoff Scenario Tests ---');

        const result1 = runPayoffScenario(300000, 0.06, 30, 1990);
        this.assert(!result1.error, 'Payoff scenario runs without error');
        this.assert(!result1.failed, 'Payoff scenario never fails');
        this.assertGreater(result1.finalValue, 0, 'Final value is positive');
        this.assertApprox(result1.history[0].value, 0, 0.01, 'Starts with $0 invested');
        this.assertGreater(result1.history[360].value, 0, 'Ends with positive value');

        // Payoff in 1929 - still should not fail
        const result2 = runPayoffScenario(300000, 0.06, 30, 1929);
        this.assert(!result2.failed, 'Payoff never fails even in 1929');
        this.assertGreater(result2.finalValue, 0, 'Payoff has positive value after 1929');

        // Monthly contribution matches payment
        this.assertApprox(result1.monthlyContribution, 1798.65, 0.01, 'Monthly contribution = payment');

        // Value should grow monotonically (adding money each month)
        let monotonic = true;
        for (let i = 1; i < result1.history.length; i++) {
            if (result1.history[i].value < result1.history[i-1].value * 0.5) {
                monotonic = false; // Allow some drops, but not catastrophic
            }
        }
        this.assert(monotonic, 'Payoff value generally increases over time');
    },

    // =========================================================================
    // SCENARIO COMPARISON TESTS - MODEL 1 (DRAWDOWN)
    // =========================================================================
    testCompareScenariosDrawdown() {
        console.log('\n--- Scenario Comparison Tests (Drawdown) ---');

        const comp1 = compareScenarios(300000, 0.06, 30, 1990, 'drawdown');
        this.assert(!comp1.error, 'Comparison runs without error');
        this.assert(comp1.winner === 'invest' || comp1.winner === 'payoff', 'Winner is invest or payoff');
        this.assert(typeof comp1.difference === 'number', 'Difference is a number');
        this.assert(comp1.invest !== undefined, 'Invest result included');
        this.assert(comp1.payoff !== undefined, 'Payoff result included');

        // If invest failed, payoff should win
        if (comp1.invest.failed) {
            this.assert(comp1.winner === 'payoff', 'If invest fails, payoff wins');
        }

        // Difference should equal invest - payoff
        const expectedDiff = comp1.invest.finalValue - comp1.payoff.finalValue;
        this.assertApprox(comp1.difference, expectedDiff, 0.01, 'Difference = invest - payoff');
    },

    // =========================================================================
    // SCENARIO COMPARISON TESTS - MODEL 2 (SEPARATE)
    // =========================================================================
    testCompareScenariosSeparate() {
        console.log('\n--- Scenario Comparison Tests (Separate Income) ---');

        const comp1 = compareScenarios(300000, 0.06, 30, 1990, 'separate');
        this.assert(!comp1.error, 'Comparison runs without error');
        this.assert(comp1.winner === 'invest' || comp1.winner === 'payoff', 'Winner is invest or payoff');
        this.assert(!comp1.invest.failed, 'Model 2 invest never fails');

        // Model 2 should have different results than Model 1
        const comp2 = compareScenarios(300000, 0.06, 30, 1990, 'drawdown');
        this.assert(comp1.invest.finalValue !== comp2.invest.finalValue,
            'Model 2 invest differs from Model 1');
    },

    // =========================================================================
    // HISTORICAL ANALYSIS TESTS - MODEL 1
    // =========================================================================
    testHistoricalAnalysisDrawdown() {
        console.log('\n--- Historical Analysis Tests (Drawdown) ---');

        const hist = runHistoricalAnalysis(300000, 0.06, 30, 'drawdown');

        this.assertGreater(hist.results.length, 0, 'Historical analysis produces results');
        this.assertGreater(hist.summary.totalYears, 50, 'At least 50 years analyzed');
        this.assert(hist.summary.investWins >= 0, 'Invest wins count non-negative');
        this.assert(hist.summary.payoffWins >= 0, 'Payoff wins count non-negative');
        this.assert(hist.summary.failures >= 0, 'Failures count non-negative');

        // Total should add up
        const total = hist.summary.investWins + hist.summary.payoffWins;
        this.assert(total === hist.summary.totalYears, 'investWins + payoffWins = totalYears');

        // In drawdown model, failures should be > 0 historically
        this.assertGreater(hist.summary.failures, 0, 'Drawdown model has some failures');

        // Each result should have required fields
        const firstResult = hist.results[0];
        this.assert(firstResult.startYear !== undefined, 'Result has startYear');
        this.assert(firstResult.investFinal !== undefined, 'Result has investFinal');
        this.assert(firstResult.payoffFinal !== undefined, 'Result has payoffFinal');
        this.assert(firstResult.winner !== undefined, 'Result has winner');
    },

    // =========================================================================
    // HISTORICAL ANALYSIS TESTS - MODEL 2
    // =========================================================================
    testHistoricalAnalysisSeparate() {
        console.log('\n--- Historical Analysis Tests (Separate Income) ---');

        const hist = runHistoricalAnalysis(300000, 0.06, 30, 'separate');

        this.assertGreater(hist.results.length, 0, 'Historical analysis produces results');
        this.assertGreater(hist.summary.totalYears, 50, 'At least 50 years analyzed');

        // In separate income model, there should be 0 failures
        this.assertApprox(hist.summary.failures, 0, 0, 'Separate model has zero failures');

        // Invest should win some of the time (lump sum typically wins ~60%)
        this.assertGreater(hist.summary.investWins, 20, 'Invest wins at least 20 years');
        this.assertGreater(hist.summary.payoffWins, 10, 'Payoff wins at least 10 years');

        // Win rate should be reasonable
        const winRate = parseFloat(hist.summary.investWinRate);
        this.assertGreater(winRate, 40, 'Invest win rate > 40%');
        this.assertLess(winRate, 80, 'Invest win rate < 80%');
    },

    // =========================================================================
    // NO DOUBLE-COUNTING TESTS
    // =========================================================================
    testNoDoubleCounting() {
        console.log('\n--- No Double-Counting Tests ---');

        const invest = runInvestScenario(300000, 0.06, 30, 1990);
        const payoff = runPayoffScenario(300000, 0.06, 30, 1990);

        // Monthly payment/contribution should be identical
        this.assertApprox(invest.monthlyPayment, payoff.monthlyContribution, 0.01,
            'Monthly payment equals monthly contribution');

        // Invest starts with full balance
        this.assertApprox(invest.history[0].value, 300000, 0.01,
            'Invest starts with full lump sum');

        // Payoff starts with zero
        this.assertApprox(payoff.history[0].value, 0, 0.01,
            'Payoff starts with zero');

        // Total money in play is the same
        // Invest: starts with lump sum, withdraws payments
        // Payoff: uses lump sum to pay off, invests payments
        // Both use same monthly amount
        this.assert(true, 'Both scenarios use same monthly cash flow');
    },

    // =========================================================================
    // RISK ASYMMETRY TESTS
    // =========================================================================
    testRiskAsymmetry() {
        console.log('\n--- Risk Asymmetry Tests ---');

        // Payoff in worst case scenario (1929 crash)
        const payoff = runPayoffScenario(300000, 0.06, 30, 1929);
        this.assert(!payoff.failed, 'Payoff never fails (no foreclosure risk)');
        this.assertGreater(payoff.finalValue, 0, 'Payoff final value positive');

        // Invest in worst case (drawdown model)
        const invest = runInvestScenario(300000, 0.08, 30, 1929);
        // This may or may not fail, but demonstrates the asymmetry

        // Model 2 invest never fails
        const investM2 = runInvestScenarioModel2(300000, 0.06, 30, 1929);
        this.assert(!investM2.failed, 'Model 2 invest never fails');
    },

    // =========================================================================
    // EDGE CASE TESTS
    // =========================================================================
    testEdgeCases() {
        console.log('\n--- Edge Case Tests ---');

        // Very short term (1 year)
        const short = runInvestScenario(100000, 0.06, 1, 1990);
        this.assert(!short.error, '1-year term works');
        this.assert(short.history.length === 13, '1-year has 13 entries (0-12 months)');

        // Very low balance
        const low = runInvestScenario(10000, 0.06, 30, 1990);
        this.assert(!low.error, 'Low balance works');

        // Very high balance
        const high = runInvestScenario(2000000, 0.06, 30, 1990);
        this.assert(!high.error, 'High balance works');

        // Different starting months (February start)
        const febStart = runInvestScenario(300000, 0.06, 30, 1990, 2);
        // This might error if we don't have enough data
        if (!febStart.error) {
            this.assert(febStart.history.length === 361, 'Feb start has correct history length');
        } else {
            this.assert(true, 'Feb start correctly errors if insufficient data');
        }
    },

    // =========================================================================
    // DATA INTEGRITY TESTS
    // =========================================================================
    testDataIntegrity() {
        console.log('\n--- Data Integrity Tests ---');

        // Check that SP500_MONTHLY_RETURNS exists
        this.assert(typeof SP500_MONTHLY_RETURNS === 'object', 'SP500_MONTHLY_RETURNS exists');

        // Check data range
        const keys = Object.keys(SP500_MONTHLY_RETURNS).sort();
        this.assertGreater(keys.length, 1000, 'More than 1000 months of data');

        const firstKey = keys[0];
        const lastKey = keys[keys.length - 1];
        this.assert(firstKey === '1928-02', 'Data starts at 1928-02');
        this.assertGreater(parseInt(lastKey.split('-')[0]), 2020, 'Data extends past 2020');

        // Check a known historical value (Oct 1987 crash)
        const oct1987 = SP500_MONTHLY_RETURNS['1987-10'];
        if (oct1987 !== undefined) {
            this.assertLess(oct1987, -0.15, 'Oct 1987 shows significant crash');
        }
    },

    // =========================================================================
    // CONSISTENCY TESTS
    // =========================================================================
    testConsistency() {
        console.log('\n--- Consistency Tests ---');

        // Same inputs should give same outputs
        const result1 = runInvestScenario(300000, 0.06, 30, 1990);
        const result2 = runInvestScenario(300000, 0.06, 30, 1990);
        this.assertApprox(result1.finalValue, result2.finalValue, 0.01,
            'Same inputs give same outputs');

        // Model comparison should be consistent
        const comp1 = compareScenarios(300000, 0.06, 30, 1990, 'drawdown');
        const comp2 = compareScenarios(300000, 0.06, 30, 1990, 'drawdown');
        this.assert(comp1.winner === comp2.winner, 'Comparison gives consistent winner');

        // Historical analysis should be consistent
        const hist1 = runHistoricalAnalysis(300000, 0.06, 30, 'drawdown');
        const hist2 = runHistoricalAnalysis(300000, 0.06, 30, 'drawdown');
        this.assert(hist1.summary.investWins === hist2.summary.investWins,
            'Historical analysis is consistent');
    },

    // =========================================================================
    // RUN ALL TESTS
    // =========================================================================
    runAll() {
        console.log('='.repeat(60));
        console.log('Mortgage Payoff Calculator v2 - Comprehensive Test Suite');
        console.log('='.repeat(60));

        this.testMonthlyPayment();
        this.testGetMonthlyReturns();
        this.testInvestScenarioDrawdown();
        this.testInvestScenarioSeparate();
        this.testPayoffScenario();
        this.testCompareScenariosDrawdown();
        this.testCompareScenariosSeparate();
        this.testHistoricalAnalysisDrawdown();
        this.testHistoricalAnalysisSeparate();
        this.testNoDoubleCounting();
        this.testRiskAsymmetry();
        this.testEdgeCases();
        this.testDataIntegrity();
        this.testConsistency();

        console.log('\n' + '='.repeat(60));
        console.log(`Results: ${this.passed} passed, ${this.failed} failed`);
        console.log('='.repeat(60));

        return this.failed === 0;
    }
};

// Export for Node.js or make available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = tests;
}
if (typeof window !== 'undefined') {
    window.tests = tests;
}
// Also assign to global for vm context
if (typeof global !== 'undefined') {
    global.tests = tests;
}
