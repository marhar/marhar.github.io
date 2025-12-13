/**
 * Mortgage Payoff vs Invest Calculator
 * Main application logic
 */

/**
 * Extract monthly returns for a given date range
 * Reused from stockreturns calculator
 */
function getMonthlyReturns(startDate, numMonths) {
    const returns = [];
    const dates = [];
    const start = new Date(startDate);

    let current = new Date(start.getFullYear(), start.getMonth(), 1);

    for (let i = 0; i < numMonths; i++) {
        const yearMonth = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;

        if (SP500_MONTHLY_RETURNS[yearMonth] !== undefined) {
            returns.push(SP500_MONTHLY_RETURNS[yearMonth]);
            dates.push(yearMonth);
        } else {
            // If data not available, use 0 return (conservative)
            returns.push(0);
            dates.push(yearMonth);
        }

        current.setMonth(current.getMonth() + 1);
    }

    return { returns, dates };
}

/**
 * Scenario A: Pay off mortgage with lump sum
 * Then invest the freed-up monthly payment for the remaining time
 *
 * @param {number} balance - Mortgage balance
 * @param {number} rate - Annual interest rate
 * @param {number} years - Remaining years
 * @param {number} lumpSum - Lump sum to apply to mortgage
 * @param {string} startDate - Start date for S&P 500 returns
 * @returns {Object} Results including net worth over time
 */
function scenarioPayoffMortgage(balance, rate, years, lumpSum, startDate) {
    const totalMonths = years * 12;
    const originalPayment = calculateMonthlyPayment(balance, rate, years);

    // Get S&P 500 returns for the full period
    const { returns: monthlyReturns } = getMonthlyReturns(startDate, totalMonths);

    // Apply lump sum to mortgage
    let mortgageBalance = balance - lumpSum;
    let investmentBalance = 0;
    let totalInterest = 0;
    let paidOff = mortgageBalance <= 0;
    let newPayment = 0;

    if (paidOff) {
        // Mortgage fully paid off
        mortgageBalance = 0;
        newPayment = 0;
    } else {
        // Mortgage partially paid off - recalculate payment for new balance
        newPayment = calculateMonthlyPayment(mortgageBalance, rate, years);
    }

    // Amount freed up to invest each month
    const freedAmount = originalPayment - newPayment;

    const monthlyNetWorth = [];
    const monthlyInvestment = [];
    const monthlyMortgage = [];

    for (let month = 1; month <= totalMonths; month++) {
        // Invest freed-up payment amount
        investmentBalance += freedAmount;
        // Apply S&P 500 return for this month
        investmentBalance *= (1 + monthlyReturns[month - 1]);

        // Update mortgage balance (if not paid off)
        if (!paidOff && mortgageBalance > 0) {
            const monthlyRate = rate / 12;
            const interestPayment = mortgageBalance * monthlyRate;
            const principalPayment = newPayment - interestPayment;

            totalInterest += interestPayment;
            mortgageBalance -= principalPayment;

            if (mortgageBalance < 0.01) {
                mortgageBalance = 0;
                paidOff = true;
            }
        }

        // Net worth = investment - mortgage balance
        const netWorth = investmentBalance - mortgageBalance;

        monthlyNetWorth.push(netWorth);
        monthlyInvestment.push(investmentBalance);
        monthlyMortgage.push(mortgageBalance);
    }

    return {
        paidOff: lumpSum >= balance,
        newBalance: Math.max(0, balance - lumpSum),
        newPayment,
        freedAmount,
        totalInterest,
        finalInvestmentValue: investmentBalance,
        finalNetWorth: monthlyNetWorth[monthlyNetWorth.length - 1],
        monthlyNetWorth,
        monthlyInvestment,
        monthlyMortgage
    };
}

/**
 * Scenario B: Keep mortgage, invest lump sum
 *
 * @param {number} balance - Mortgage balance
 * @param {number} rate - Annual interest rate
 * @param {number} years - Remaining years
 * @param {number} lumpSum - Lump sum to invest
 * @param {string} startDate - Start date for S&P 500 returns
 * @returns {Object} Results including net worth over time
 */
function scenarioInvestLumpSum(balance, rate, years, lumpSum, startDate) {
    // Calculate normal mortgage schedule
    const amortization = calculateAmortizationSchedule(balance, rate, years);
    const totalMonths = years * 12;

    // Get S&P 500 returns
    const { returns: monthlyReturns } = getMonthlyReturns(startDate, totalMonths);

    // Invest lump sum immediately
    let investmentBalance = lumpSum;
    let mortgageBalance = balance;
    const monthlyNetWorth = [];
    const monthlyInvestment = [];
    const monthlyMortgage = [];

    for (let month = 1; month <= totalMonths; month++) {
        // Apply S&P 500 return to investment
        investmentBalance *= (1 + monthlyReturns[month - 1]);

        // Update mortgage balance
        const scheduleEntry = amortization.schedule[month - 1];
        mortgageBalance = scheduleEntry.balance;

        // Net worth = investment - mortgage balance
        const netWorth = investmentBalance - mortgageBalance;

        monthlyNetWorth.push(netWorth);
        monthlyInvestment.push(investmentBalance);
        monthlyMortgage.push(mortgageBalance);
    }

    return {
        totalInterest: amortization.totalInterest,
        finalInvestmentValue: investmentBalance,
        investmentGrowth: investmentBalance - lumpSum,
        finalNetWorth: monthlyNetWorth[monthlyNetWorth.length - 1],
        monthlyNetWorth,
        monthlyInvestment,
        monthlyMortgage
    };
}

/**
 * Format number as currency
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

/**
 * Format number with one decimal place
 */
function formatDecimal(value, decimals = 1) {
    return value.toFixed(decimals);
}

/**
 * Display comparison results
 */
function displayResults(payoffResults, investResults, lumpSum) {
    // Show results section
    document.getElementById('resultsSection').classList.add('active');

    // Payoff scenario (always fully paid off since lumpSum = balance)
    document.getElementById('payoffStatus').textContent = 'Fully Paid';
    const interestSaved = investResults.totalInterest - payoffResults.totalInterest;
    document.getElementById('payoffInterestSaved').textContent = formatCurrency(interestSaved);
    document.getElementById('payoffInvestment').textContent = formatCurrency(payoffResults.finalInvestmentValue);
    document.getElementById('payoffNetWorth').textContent = formatCurrency(payoffResults.finalNetWorth);

    // Invest scenario
    document.getElementById('investValue').textContent = formatCurrency(investResults.finalInvestmentValue);
    document.getElementById('investInterest').textContent = formatCurrency(investResults.totalInterest);
    document.getElementById('investGrowth').textContent = formatCurrency(investResults.investmentGrowth);
    document.getElementById('investNetWorth').textContent = formatCurrency(investResults.finalNetWorth);

    // Winner
    const payoffCard = document.getElementById('payoffCard');
    const investCard = document.getElementById('investCard');
    payoffCard.classList.remove('winner');
    investCard.classList.remove('winner');

    if (payoffResults.finalNetWorth > investResults.finalNetWorth) {
        document.getElementById('winnerStrategy').textContent = 'Pay Off Mortgage';
        document.getElementById('winnerAdvantage').textContent = formatCurrency(payoffResults.finalNetWorth - investResults.finalNetWorth);
        document.getElementById('winnerNote').textContent = 'Paying off your mortgage wins. The guaranteed return (your interest rate) beats the market for this period.';
        payoffCard.classList.add('winner');
    } else {
        document.getElementById('winnerStrategy').textContent = 'Invest the Cash';
        document.getElementById('winnerAdvantage').textContent = formatCurrency(investResults.finalNetWorth - payoffResults.finalNetWorth);
        document.getElementById('winnerNote').textContent = 'Investing wins. S&P 500 returns outpaced your mortgage interest rate for this period.';
        investCard.classList.add('winner');
    }

    // Scroll to results
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Display net worth comparison chart
 */
let netWorthChart = null;

function displayChart(payoffResults, investResults, years) {
    const ctx = document.getElementById('netWorthChart').getContext('2d');

    // Generate labels (years)
    const totalMonths = years * 12;
    const labels = [];
    for (let month = 0; month <= totalMonths; month += 12) {
        labels.push(`Year ${month / 12}`);
    }

    // Sample data points (yearly)
    const payoffData = [0];
    const investData = [0];
    for (let month = 12; month <= totalMonths; month += 12) {
        payoffData.push(payoffResults.monthlyNetWorth[month - 1]);
        investData.push(investResults.monthlyNetWorth[month - 1]);
    }

    // Destroy existing chart
    if (netWorthChart) {
        netWorthChart.destroy();
    }

    netWorthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Pay Off Mortgage',
                    data: payoffData,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.1,
                    fill: false
                },
                {
                    label: 'Invest Lump Sum',
                    data: investData,
                    borderColor: 'rgb(34, 197, 94)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.1,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Years'
                    }
                }
            }
        }
    });
}

/**
 * Form submission handler
 */
document.getElementById('calculatorForm').addEventListener('submit', function(e) {
    e.preventDefault();

    try {
        // Get form values
        const balance = parseFloat(document.getElementById('balance').value);
        const rate = parseFloat(document.getElementById('rate').value) / 100;
        const years = parseFloat(document.getElementById('years').value);
        const startDate = document.getElementById('startDate').value;

        // Lump sum equals mortgage balance
        const lumpSum = balance;

        // Validate
        if (balance <= 0 || rate <= 0 || years <= 0) {
            alert('Please enter valid positive values for balance, rate, and years');
            return;
        }

        // Run both scenarios
        const payoffResults = scenarioPayoffMortgage(balance, rate, years, lumpSum, startDate);
        const investResults = scenarioInvestLumpSum(balance, rate, years, lumpSum, startDate);

        // Display results
        displayResults(payoffResults, investResults, lumpSum);
        displayChart(payoffResults, investResults, years);

    } catch (error) {
        alert('Error: ' + error.message);
        console.error(error);
    }
});
