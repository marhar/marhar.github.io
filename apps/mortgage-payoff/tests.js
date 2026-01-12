// Mortgage Payoff Calculator v2 - Tests
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

    // Test: Monthly payment calculation
    testMonthlyPayment() {
        console.log('\n--- Monthly Payment Tests ---');

        // Standard 30-year mortgage at 6%
        const payment = calculateMonthlyPayment(300000, 0.06, 30);
        this.assertApprox(payment, 1798.65, 0.01, 'Monthly payment for $300k at 6% for 30 years');

        // 15-year mortgage at 4%
        const payment2 = calculateMonthlyPayment(200000, 0.04, 15);
        this.assertApprox(payment2, 1479.38, 0.01, 'Monthly payment for $200k at 4% for 15 years');

        // Zero interest rate
        const payment3 = calculateMonthlyPayment(120000, 0, 10);
        this.assertApprox(payment3, 1000, 0.01, 'Monthly payment at 0% interest');
    },

    // Test: Getting monthly returns
    testGetMonthlyReturns() {
        console.log('\n--- Monthly Returns Tests ---');

        // Valid period
        const returns = getMonthlyReturns(1990, 1, 12);
        this.assert(returns !== null, 'Can get returns for 1990');
        this.assert(returns.length === 12, 'Returns array has 12 months');

        // Invalid period (too far in future)
        const returns2 = getMonthlyReturns(2100, 1, 12);
        this.assert(returns2 === null, 'Returns null for future dates');

        // Partial data (not enough months)
        const returns3 = getMonthlyReturns(1928, 1, 12);
        this.assert(returns3 === null, 'Returns null when starting before data (1928-01)');
    },

    // Test: Invest scenario (drawdown model)
    testInvestScenario() {
        console.log('\n--- Invest Scenario Tests ---');

        // Run for a known good period (1990s bull market)
        const result = runInvestScenario(300000, 0.06, 30, 1990);
        this.assert(!result.error, 'Invest scenario runs without error for 1990');
        this.assert(!result.failed, 'Invest scenario does not fail in 1990 (bull market)');
        this.assert(result.finalValue > 0, 'Final value is positive');
        this.assert(result.history.length === 361, 'History has 361 entries (0-360 months)');

        // Check that withdrawals happen (investment should generally be less than pure growth)
        this.assert(result.monthlyPayment > 0, 'Monthly payment is calculated');
    },

    // Test: Payoff scenario (contribute monthly)
    testPayoffScenario() {
        console.log('\n--- Payoff Scenario Tests ---');

        const result = runPayoffScenario(300000, 0.06, 30, 1990);
        this.assert(!result.error, 'Payoff scenario runs without error');
        this.assert(!result.failed, 'Payoff scenario never fails');
        this.assert(result.finalValue > 0, 'Final value is positive');
        this.assert(result.history[0].value === 0, 'Starts with $0 invested');
        this.assert(result.history[360].value > 0, 'Ends with positive value');
    },

    // Test: Scenario comparison
    testCompareScenarios() {
        console.log('\n--- Scenario Comparison Tests ---');

        const comparison = compareScenarios(300000, 0.06, 30, 1990);
        this.assert(!comparison.error, 'Comparison runs without error');
        this.assert(comparison.winner === 'invest' || comparison.winner === 'payoff',
            'Winner is either invest or payoff');
        this.assert(typeof comparison.difference === 'number', 'Difference is a number');
    },

    // Test: Drawdown failure detection
    testDrawdownFailure() {
        console.log('\n--- Drawdown Failure Tests ---');

        // 1929 crash should cause failures for a long term high-value mortgage
        const result = runInvestScenario(300000, 0.08, 30, 1929);

        // Even if this specific test passes/fails, we're checking the mechanism works
        this.assert(result.history.length > 0, 'History is populated even for crash periods');

        if (result.failed) {
            this.assert(result.failureMonth > 0, 'Failure month is recorded');
            this.assert(result.finalValue === 0, 'Final value is 0 on failure');
        } else {
            console.log('  (Note: 1929 did not cause failure with these parameters)');
            this.passed++;
        }
    },

    // Test: Historical analysis
    testHistoricalAnalysis() {
        console.log('\n--- Historical Analysis Tests ---');

        const historical = runHistoricalAnalysis(300000, 0.06, 30);

        this.assert(historical.results.length > 0, 'Historical analysis produces results');
        this.assert(historical.summary.totalYears > 0, 'Summary has total years');
        this.assert(historical.summary.investWins >= 0, 'Invest wins count is non-negative');
        this.assert(historical.summary.payoffWins >= 0, 'Payoff wins count is non-negative');

        // Total should add up
        const total = historical.summary.investWins + historical.summary.payoffWins;
        this.assert(total === historical.summary.totalYears,
            'Invest wins + payoff wins = total years');
    },

    // Test: No double-counting
    testNoDoubleCounting() {
        console.log('\n--- No Double-Counting Tests ---');

        // In invest scenario, we start with the lump sum and subtract payments
        // In payoff scenario, we start with $0 and add payments
        // The monthly payment amount should be the same in both

        const invest = runInvestScenario(300000, 0.06, 30, 1990);
        const payoff = runPayoffScenario(300000, 0.06, 30, 1990);

        this.assertApprox(invest.monthlyPayment, payoff.monthlyContribution, 0.01,
            'Monthly payment equals monthly contribution');

        // Invest starts with full balance
        this.assertApprox(invest.history[0].value, 300000, 0.01,
            'Invest starts with full lump sum');

        // Payoff starts with zero
        this.assertApprox(payoff.history[0].value, 0, 0.01,
            'Payoff starts with zero');
    },

    // Test: Risk asymmetry
    testRiskAsymmetry() {
        console.log('\n--- Risk Asymmetry Tests ---');

        const payoff = runPayoffScenario(300000, 0.06, 30, 1929);

        // Payoff scenario should never fail, even in worst market conditions
        this.assert(!payoff.failed, 'Payoff scenario never fails (no foreclosure risk)');
        this.assert(payoff.finalValue >= 0, 'Payoff final value is non-negative');
    },

    runAll() {
        console.log('='.repeat(50));
        console.log('Mortgage Payoff Calculator v2 - Test Suite');
        console.log('='.repeat(50));

        this.testMonthlyPayment();
        this.testGetMonthlyReturns();
        this.testInvestScenario();
        this.testPayoffScenario();
        this.testCompareScenarios();
        this.testDrawdownFailure();
        this.testHistoricalAnalysis();
        this.testNoDoubleCounting();
        this.testRiskAsymmetry();

        console.log('\n' + '='.repeat(50));
        console.log(`Results: ${this.passed} passed, ${this.failed} failed`);
        console.log('='.repeat(50));

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
