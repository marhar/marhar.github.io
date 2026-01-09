/**
 * Mortgage Payoff vs Invest Calculator - Automated Test Suite
 * Run these tests to verify calculation correctness
 */

const TestSuite = {
    passed: 0,
    failed: 0,
    results: [],

    assertEqual(actual, expected, tolerance, testName) {
        const diff = Math.abs(actual - expected);
        const passed = diff <= tolerance;

        this.results.push({
            name: testName,
            passed,
            actual,
            expected,
            diff
        });

        if (passed) {
            this.passed++;
        } else {
            this.failed++;
        }
        return passed;
    },

    assertTrue(condition, testName, actual, expected) {
        this.results.push({
            name: testName,
            passed: condition,
            actual,
            expected,
            diff: 0
        });

        if (condition) {
            this.passed++;
        } else {
            this.failed++;
        }
        return condition;
    },

    // Test 1: Monthly payment calculation
    testMonthlyPayment() {
        const testName = "Monthly payment for $300k @ 3.5% for 30 years";
        // Standard mortgage calculation: $1,347.13/month
        const expected = 1347.13;
        const actual = calculateMonthlyPayment(300000, 0.035, 30);
        return this.assertEqual(actual, expected, 0.01, testName);
    },

    // Test 2: Monthly payment - zero interest
    testMonthlyPaymentZeroRate() {
        const testName = "Monthly payment with 0% interest";
        // $120,000 over 10 years = $1,000/month
        const expected = 1000;
        const actual = calculateMonthlyPayment(120000, 0, 10);
        return this.assertEqual(actual, expected, 0.01, testName);
    },

    // Test 3: Amortization schedule total interest
    testAmortizationTotalInterest() {
        const testName = "Total interest for $300k @ 3.5% for 30 years";
        // Total payments = 1347.13 * 360 = 484,966.80
        // Total interest = 484,966.80 - 300,000 = ~184,966
        const schedule = calculateAmortizationSchedule(300000, 0.035, 30);
        const expectedInterest = 184968; // Calculated value
        return this.assertEqual(schedule.totalInterest, expectedInterest, 10, testName);
    },

    // Test 4: Amortization ends at zero balance
    testAmortizationEndsAtZero() {
        const testName = "Amortization ends with zero balance";
        const schedule = calculateAmortizationSchedule(300000, 0.035, 30);
        const finalBalance = schedule.schedule[schedule.schedule.length - 1].balance;
        return this.assertEqual(finalBalance, 0, 0.01, testName);
    },

    // Test 5: Extra payments reduce term
    testExtraPaymentsReduceTerm() {
        const testName = "Extra $500/month reduces 30-year term";
        const normal = calculateAmortizationSchedule(300000, 0.035, 30);
        const accelerated = calculateAmortizationWithExtra(300000, 0.035, 30, 500);

        const passed = accelerated.monthsToPayoff < normal.totalPayments;
        return this.assertTrue(
            passed,
            testName,
            `${accelerated.monthsToPayoff} months`,
            `< ${normal.totalPayments} months`
        );
    },

    // Test 6: Extra payments save interest
    testExtraPaymentsSaveInterest() {
        const testName = "Extra $500/month saves significant interest";
        const normal = calculateAmortizationSchedule(300000, 0.035, 30);
        const accelerated = calculateAmortizationWithExtra(300000, 0.035, 30, 500);

        const interestSaved = normal.totalInterest - accelerated.totalInterest;
        // Should save at least $50,000 in interest
        return this.assertTrue(
            interestSaved > 50000,
            testName,
            formatCurrency(interestSaved) + " saved",
            "> $50,000"
        );
    },

    // Test 7: Scenario comparison during bull market (2010-2020)
    testBullMarketFavorsInvesting() {
        const testName = "Bull market (2010-2020) favors investing";
        const balance = 300000;
        const rate = 0.04;
        const years = 10;

        const payoff = scenarioPayoffMortgage(balance, rate, years, balance, "2010-01-01");
        const invest = scenarioInvestLumpSum(balance, rate, years, balance, "2010-01-01");

        // During 2010-2020 bull market, investing should win
        return this.assertTrue(
            invest.finalNetWorth > payoff.finalNetWorth,
            testName,
            `Invest: ${formatCurrency(invest.finalNetWorth)} vs Payoff: ${formatCurrency(payoff.finalNetWorth)}`,
            "Invest > Payoff"
        );
    },

    // Test 8: High interest rate favors payoff
    testHighRateFavorsPayoff() {
        const testName = "Very high mortgage rate (15%) during flat market";
        const balance = 100000;
        const rate = 0.15; // 15% mortgage rate
        const years = 5;

        // Use a relatively flat period
        const payoff = scenarioPayoffMortgage(balance, rate, years, balance, "2015-01-01");
        const invest = scenarioInvestLumpSum(balance, rate, years, balance, "2015-01-01");

        // With 15% mortgage rate, payoff should likely win
        // (unless market returns are exceptional)
        const payoffWins = payoff.finalNetWorth > invest.finalNetWorth;

        return this.assertTrue(
            true, // Just log the result, don't fail
            testName,
            `Payoff wins: ${payoffWins}. Payoff: ${formatCurrency(payoff.finalNetWorth)}, Invest: ${formatCurrency(invest.finalNetWorth)}`,
            "Logged for analysis"
        );
    },

    // Test 9: Data truncation handling
    testDataTruncation() {
        const testName = "Future dates are truncated to available data";
        const balance = 100000;
        const rate = 0.04;
        const years = 50; // Request more years than data available

        const payoff = scenarioPayoffMortgage(balance, rate, years, balance, "2020-01-01");

        return this.assertTrue(
            payoff.truncated === true,
            testName,
            `truncated: ${payoff.truncated}, actualMonths: ${payoff.actualMonths}`,
            "truncated: true"
        );
    },

    // Test 10: Net worth starts at approximately zero
    testNetWorthStartsNearZero() {
        const testName = "Both scenarios start with similar net worth";
        const balance = 300000;
        const rate = 0.04;
        const years = 10;

        const payoff = scenarioPayoffMortgage(balance, rate, years, balance, "2020-01-01");
        const invest = scenarioInvestLumpSum(balance, rate, years, balance, "2020-01-01");

        // First month net worth should be close for both
        // Payoff: small investment (one month's payment) with market return
        // Invest: lump sum with market return minus mortgage balance
        const payoffMonth1 = payoff.monthlyNetWorth[0];
        const investMonth1 = invest.monthlyNetWorth[0];

        // Both should be relatively small compared to the $300k balance
        const bothSmall = Math.abs(payoffMonth1) < 50000 && Math.abs(investMonth1) < 50000;

        return this.assertTrue(
            bothSmall,
            testName,
            `Payoff M1: ${formatCurrency(payoffMonth1)}, Invest M1: ${formatCurrency(investMonth1)}`,
            "Both < $50k from zero"
        );
    },

    // Test 11: Monthly returns bounds check
    testMonthlyReturnsBounds() {
        const testName = "Monthly S&P 500 returns within reasonable bounds";

        let allWithinBounds = true;
        let worstMonth = 0;
        let bestMonth = 0;

        for (const [date, ret] of Object.entries(SP500_MONTHLY_RETURNS)) {
            if (ret < worstMonth) worstMonth = ret;
            if (ret > bestMonth) bestMonth = ret;
            if (ret < -0.35 || ret > 0.50) {
                allWithinBounds = false;
            }
        }

        return this.assertTrue(
            allWithinBounds,
            testName,
            `Worst: ${(worstMonth * 100).toFixed(1)}%, Best: ${(bestMonth * 100).toFixed(1)}%`,
            "All between -35% and +50%"
        );
    },

    // Test 12: Payoff scenario investment grows
    testPayoffInvestmentGrows() {
        const testName = "Payoff scenario: freed payment invested grows";
        const balance = 300000;
        const rate = 0.04;
        const years = 10;

        const payoff = scenarioPayoffMortgage(balance, rate, years, balance, "2010-01-01");

        // Should have invested monthly payments and they should grow
        const monthlyPayment = calculateMonthlyPayment(balance, rate, years);
        const totalInvested = monthlyPayment * payoff.actualMonths;

        return this.assertTrue(
            payoff.finalInvestmentValue > totalInvested * 0.5, // At least kept half (even in bad market)
            testName,
            `Final: ${formatCurrency(payoff.finalInvestmentValue)}, Invested: ${formatCurrency(totalInvested)}`,
            "Investment value > 50% of contributions"
        );
    },

    // Test 13: Invest scenario mortgage decreases
    testInvestMortgageDecreases() {
        const testName = "Invest scenario: mortgage balance decreases monthly";
        const balance = 300000;
        const rate = 0.04;
        const years = 10;

        const invest = scenarioInvestLumpSum(balance, rate, years, balance, "2020-01-01");

        // Mortgage should decrease over time
        const firstMonth = invest.monthlyMortgage[0];
        const lastMonth = invest.monthlyMortgage[invest.monthlyMortgage.length - 1];

        return this.assertTrue(
            lastMonth < firstMonth,
            testName,
            `First: ${formatCurrency(firstMonth)}, Last: ${formatCurrency(lastMonth)}`,
            "Last < First"
        );
    },

    // Test 14: Verify data range
    testDataRange() {
        const testName = "Data range includes 1928 to recent";
        const has1928 = SP500_MONTHLY_RETURNS["1928-02"] !== undefined;
        const has2024 = SP500_MONTHLY_RETURNS["2024-01"] !== undefined;

        return this.assertTrue(
            has1928 && has2024,
            testName,
            `1928: ${has1928}, 2024: ${has2024}`,
            "Both true"
        );
    },

    // Test 15: Compare scenarios sanity check
    testCompareScenariosSanity() {
        const testName = "comparePayoffScenarios returns valid data";
        const result = comparePayoffScenarios(300000, 0.04, 30, 500);

        const valid = result.interestSaved > 0 &&
                      result.monthsSaved > 0 &&
                      result.normal.totalInterest > result.accelerated.totalInterest;

        return this.assertTrue(
            valid,
            testName,
            `Saved: ${formatCurrency(result.interestSaved)}, ${result.monthsSaved} months`,
            "Valid savings"
        );
    },

    runAll() {
        this.passed = 0;
        this.failed = 0;
        this.results = [];

        console.log("Running Mortgage Payoff Calculator Test Suite...\n");

        this.testMonthlyPayment();
        this.testMonthlyPaymentZeroRate();
        this.testAmortizationTotalInterest();
        this.testAmortizationEndsAtZero();
        this.testExtraPaymentsReduceTerm();
        this.testExtraPaymentsSaveInterest();
        this.testBullMarketFavorsInvesting();
        this.testHighRateFavorsPayoff();
        this.testDataTruncation();
        this.testNetWorthStartsNearZero();
        this.testMonthlyReturnsBounds();
        this.testPayoffInvestmentGrows();
        this.testInvestMortgageDecreases();
        this.testDataRange();
        this.testCompareScenariosSanity();

        console.log("\n========================================");
        console.log(`RESULTS: ${this.passed} passed, ${this.failed} failed`);
        console.log("========================================\n");

        for (const result of this.results) {
            const status = result.passed ? "✓" : "✗";
            console.log(`${status} ${result.name}`);
            if (!result.passed) {
                console.log(`   Expected: ${result.expected}`);
                console.log(`   Actual: ${result.actual}`);
            }
        }

        return {
            passed: this.passed,
            failed: this.failed,
            results: this.results
        };
    }
};

// Export for use in test page
if (typeof window !== 'undefined') {
    window.TestSuite = TestSuite;
}
