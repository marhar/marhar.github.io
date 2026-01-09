/**
 * Stock Returns Calculator - Automated Test Suite
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

    // Test 1: Simple single month return
    testSingleMonthReturn() {
        const testName = "Single month return (Jan 2024)";
        const initial = 1000;
        const monthly = 0;
        const janReturn = SP500_MONTHLY_RETURNS["2024-01"]; // 0.0159

        const expected = initial * (1 + janReturn);

        // Simulate the calculation
        const { returns } = getMonthlyReturns("2024-01-01", "2024-01-31");
        const result = calculateFutureValueActual(initial, monthly, returns, [], "2024-01-01");

        return this.assertEqual(result.finalValue, expected, 0.01, testName);
    },

    // Test 2: Three month DCA calculation
    testThreeMonthDCA() {
        const testName = "Three month DCA (Jan-Mar 2024)";
        const initial = 1000;
        const monthly = 100;

        // Manual calculation:
        // Month 0: $1000 * 1.0159 = $1015.90
        // Month 1: ($1015.90 + $100) * 1.0517 = $1173.61
        // Month 2: ($1173.61 + $100) * 1.0310 = $1313.12
        const expected = 1313.12;

        const { returns, dates } = getMonthlyReturns("2024-01-01", "2024-03-31");
        const result = calculateFutureValueActual(initial, monthly, returns, dates, "2024-01-01");

        return this.assertEqual(result.finalValue, expected, 0.10, testName);
    },

    // Test 3: Total invested tracking
    testTotalInvested() {
        const testName = "Total invested tracking (3 months)";
        const initial = 1000;
        const monthly = 100;
        const expected = 1200; // 1000 + 100 + 100 (first month no contribution after initial)

        const { returns, dates } = getMonthlyReturns("2024-01-01", "2024-03-31");
        const result = calculateFutureValueActual(initial, monthly, returns, dates, "2024-01-01");

        return this.assertEqual(result.totalInvested, expected, 0.01, testName);
    },

    // Test 4: Zero monthly contribution
    testZeroMonthly() {
        const testName = "Zero monthly contribution";
        const initial = 10000;
        const monthly = 0;

        const { returns, dates } = getMonthlyReturns("2024-01-01", "2024-06-30");
        const result = calculateFutureValueActual(initial, monthly, returns, dates, "2024-01-01");

        // Manually compute: initial * product of (1 + each_return)
        let expected = initial;
        for (const ret of returns) {
            expected *= (1 + ret);
        }

        return this.assertEqual(result.finalValue, expected, 0.01, testName);
    },

    // Test 5: Constant rate calculation
    testConstantRate() {
        const testName = "Constant 10% annual rate";
        const initial = 1000;
        const monthly = 100;
        const annualRate = 0.10;
        const numMonths = 12;

        const result = calculateFutureValueConstant(initial, monthly, annualRate, numMonths);

        // Manual calculation using monthly rate
        const monthlyRate = Math.pow(1.10, 1/12) - 1;
        let expected = initial;
        let totalInvested = initial;
        for (let i = 0; i < numMonths; i++) {
            if (i > 0) {
                expected += monthly;
                totalInvested += monthly;
            }
            expected *= (1 + monthlyRate);
        }

        return this.assertEqual(result.finalValue, expected, 0.01, testName);
    },

    // Test 6: IRR calculation sanity check
    testIRRSanity() {
        const testName = "IRR sanity check (positive returns)";

        const { returns, dates } = getMonthlyReturns("2010-01-01", "2020-01-01");
        const result = calculateFutureValueActual(10000, 500, returns, dates, "2010-01-01");

        // IRR should be positive for this bull market period
        const passed = result.irr > 0 && result.irr < 50;

        this.results.push({
            name: testName,
            passed,
            actual: result.irr,
            expected: "0 < IRR < 50",
            diff: 0
        });

        if (passed) this.passed++;
        else this.failed++;

        return passed;
    },

    // Test 7: Verify data range
    testDataRange() {
        const testName = "Data range includes 1928 to 2025";

        const has1928 = SP500_MONTHLY_RETURNS["1928-02"] !== undefined;
        const has2025 = SP500_MONTHLY_RETURNS["2025-01"] !== undefined;
        const passed = has1928 && has2025;

        this.results.push({
            name: testName,
            passed,
            actual: `1928: ${has1928}, 2025: ${has2025}`,
            expected: "Both true",
            diff: 0
        });

        if (passed) this.passed++;
        else this.failed++;

        return passed;
    },

    // Test 8: Known bad period (1929 crash)
    testCrashPeriod() {
        const testName = "1929 crash shows negative returns";

        const { returns, dates } = getMonthlyReturns("1929-09-01", "1929-12-31");
        const result = calculateFutureValueActual(10000, 0, returns, dates, "1929-09-01");

        // Should lose money during the crash
        const passed = result.finalValue < 10000;

        this.results.push({
            name: testName,
            passed,
            actual: result.finalValue,
            expected: "< 10000",
            diff: 0
        });

        if (passed) this.passed++;
        else this.failed++;

        return passed;
    },

    // Test 9: Return percentage calculation
    testReturnPercentage() {
        const testName = "Return percentage calculation";
        const initial = 1000;
        const monthly = 100;

        const { returns, dates } = getMonthlyReturns("2024-01-01", "2024-03-31");
        const result = calculateFutureValueActual(initial, monthly, returns, dates, "2024-01-01");

        const expectedPct = ((result.finalValue - result.totalInvested) / result.totalInvested) * 100;

        return this.assertEqual(result.returnPct, expectedPct, 0.01, testName);
    },

    // Test 10: Verify monthly returns are reasonable
    testMonthlyReturnsBounds() {
        const testName = "Monthly returns within reasonable bounds";

        let allWithinBounds = true;
        let worstMonth = 0;
        let bestMonth = 0;

        for (const [date, ret] of Object.entries(SP500_MONTHLY_RETURNS)) {
            if (ret < worstMonth) worstMonth = ret;
            if (ret > bestMonth) bestMonth = ret;
            // Monthly returns should be between -35% and +50%
            if (ret < -0.35 || ret > 0.50) {
                allWithinBounds = false;
            }
        }

        this.results.push({
            name: testName,
            passed: allWithinBounds,
            actual: `Worst: ${(worstMonth * 100).toFixed(1)}%, Best: ${(bestMonth * 100).toFixed(1)}%`,
            expected: "All between -35% and +50%",
            diff: 0
        });

        if (allWithinBounds) this.passed++;
        else this.failed++;

        return allWithinBounds;
    },

    runAll() {
        this.passed = 0;
        this.failed = 0;
        this.results = [];

        console.log("Running Stock Returns Calculator Test Suite...\n");

        this.testSingleMonthReturn();
        this.testThreeMonthDCA();
        this.testTotalInvested();
        this.testZeroMonthly();
        this.testConstantRate();
        this.testIRRSanity();
        this.testDataRange();
        this.testCrashPeriod();
        this.testReturnPercentage();
        this.testMonthlyReturnsBounds();

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
