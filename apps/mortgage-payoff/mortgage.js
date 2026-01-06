/**
 * Mortgage Amortization Library
 * Pure functions for mortgage calculations
 */

/**
 * Calculate monthly mortgage payment
 * P = L[c(1 + c)^n]/[(1 + c)^n - 1]
 *
 * @param {number} principal - Loan amount
 * @param {number} annualRate - Annual interest rate (e.g., 0.035 for 3.5%)
 * @param {number} years - Loan term in years
 * @returns {number} Monthly payment (principal + interest)
 */
function calculateMonthlyPayment(principal, annualRate, years) {
    const monthlyRate = annualRate / 12;
    const numPayments = years * 12;

    if (monthlyRate === 0) {
        return principal / numPayments;
    }

    const payment = principal *
        (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
        (Math.pow(1 + monthlyRate, numPayments) - 1);

    return payment;
}

/**
 * Calculate standard amortization schedule
 *
 * @param {number} principal - Loan amount
 * @param {number} annualRate - Annual interest rate
 * @param {number} years - Loan term in years
 * @returns {Object} Schedule with monthly breakdown and totals
 */
function calculateAmortizationSchedule(principal, annualRate, years) {
    const monthlyRate = annualRate / 12;
    const monthlyPayment = calculateMonthlyPayment(principal, annualRate, years);
    const numPayments = years * 12;

    let balance = principal;
    let totalInterest = 0;
    const schedule = [];

    for (let month = 1; month <= numPayments; month++) {
        const interestPayment = balance * monthlyRate;
        const principalPayment = monthlyPayment - interestPayment;

        balance -= principalPayment;
        totalInterest += interestPayment;

        // Avoid negative balance due to floating point errors
        if (balance < 0.01) {
            balance = 0;
        }

        schedule.push({
            month,
            payment: monthlyPayment,
            principal: principalPayment,
            interest: interestPayment,
            balance: balance,
            totalInterest: totalInterest
        });
    }

    return {
        schedule,
        monthlyPayment,
        totalPayments: numPayments,
        totalInterest,
        totalPaid: monthlyPayment * numPayments
    };
}

/**
 * Calculate amortization with extra monthly payments
 *
 * @param {number} principal - Loan amount
 * @param {number} annualRate - Annual interest rate
 * @param {number} years - Original loan term in years
 * @param {number} extraMonthly - Extra monthly payment amount
 * @returns {Object} Schedule with early payoff details
 */
function calculateAmortizationWithExtra(principal, annualRate, years, extraMonthly) {
    const monthlyRate = annualRate / 12;
    const monthlyPayment = calculateMonthlyPayment(principal, annualRate, years);
    const totalPayment = monthlyPayment + extraMonthly;

    let balance = principal;
    let totalInterest = 0;
    const schedule = [];
    let month = 0;

    while (balance > 0.01 && month < years * 12) {
        month++;

        const interestPayment = balance * monthlyRate;
        let principalPayment = totalPayment - interestPayment;

        // Last payment adjustment
        if (principalPayment > balance) {
            principalPayment = balance;
        }

        balance -= principalPayment;
        totalInterest += interestPayment;

        schedule.push({
            month,
            payment: interestPayment + principalPayment,
            principal: principalPayment,
            interest: interestPayment,
            balance: balance,
            totalInterest: totalInterest
        });
    }

    return {
        schedule,
        monthlyPayment: totalPayment,
        monthsToPayoff: month,
        yearsToPayoff: month / 12,
        totalInterest,
        totalPaid: schedule.reduce((sum, pmt) => sum + pmt.payment, 0)
    };
}

/**
 * Compare two scenarios: normal vs accelerated payoff
 *
 * @param {number} principal - Loan amount
 * @param {number} annualRate - Annual interest rate
 * @param {number} years - Original loan term in years
 * @param {number} extraMonthly - Extra monthly payment amount
 * @returns {Object} Comparison of both scenarios
 */
function comparePayoffScenarios(principal, annualRate, years, extraMonthly) {
    const normal = calculateAmortizationSchedule(principal, annualRate, years);
    const accelerated = calculateAmortizationWithExtra(principal, annualRate, years, extraMonthly);

    const interestSaved = normal.totalInterest - accelerated.totalInterest;
    const monthsSaved = normal.totalPayments - accelerated.monthsToPayoff;
    const yearsSaved = monthsSaved / 12;

    return {
        normal,
        accelerated,
        interestSaved,
        monthsSaved,
        yearsSaved
    };
}

/**
 * Calculate freed-up cash flow after mortgage payoff
 * Returns array of monthly amounts available for investing
 *
 * @param {number} monthlyPayment - Original monthly mortgage payment
 * @param {number} payoffMonth - Month when mortgage is paid off
 * @param {number} totalMonths - Total months in analysis period
 * @returns {Array} Monthly amounts available for investing
 */
function calculateFreedCashFlow(monthlyPayment, payoffMonth, totalMonths) {
    const cashFlow = [];

    for (let month = 1; month <= totalMonths; month++) {
        if (month > payoffMonth) {
            // After payoff, full payment amount is available
            cashFlow.push(monthlyPayment);
        } else {
            // Before payoff, no extra cash available
            cashFlow.push(0);
        }
    }

    return cashFlow;
}
