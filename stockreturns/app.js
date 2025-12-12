/**
 * Stock Returns Calculator - JavaScript Implementation
 * Replicates the Python CLI tool functionality for web
 */

/**
 * Calculate Internal Rate of Return using Newton-Raphson method
 * Replicates numpy_financial.irr()
 *
 * @param {number[]} cashFlows - Array of cash flows [-initial, -monthly, ..., +final]
 * @returns {number|null} Monthly IRR or null if doesn't converge
 */
function calculateIRR(cashFlows) {
    const maxIterations = 100;
    const tolerance = 1e-7;
    let rate = 0.1;  // Initial guess: 10%

    for (let i = 0; i < maxIterations; i++) {
        let npv = 0;
        let derivative = 0;

        for (let j = 0; j < cashFlows.length; j++) {
            npv += cashFlows[j] / Math.pow(1 + rate, j);
            derivative += -j * cashFlows[j] / Math.pow(1 + rate, j + 1);
        }

        if (Math.abs(npv) < tolerance) {
            return rate;
        }

        if (derivative === 0) {
            return null;
        }

        rate = rate - npv / derivative;

        if (rate <= -1) {
            return null;
        }
    }

    return null;  // Didn't converge
}

/**
 * Extract monthly returns for a given date range
 *
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {number[]} Array of monthly returns
 */
function getMonthlyReturns(startDate, endDate) {
    const returns = [];
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    let current = new Date(start.getFullYear(), start.getMonth(), 1);

    while (current <= end) {
        const yearMonth = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;

        if (SP500_MONTHLY_RETURNS[yearMonth] !== undefined) {
            returns.push(SP500_MONTHLY_RETURNS[yearMonth]);
            dates.push(yearMonth);
        }

        // Move to next month
        current.setMonth(current.getMonth() + 1);
    }

    if (returns.length === 0) {
        throw new Error(`No historical data available for the selected date range (${startDate} to ${endDate})`);
    }

    return { returns, dates };
}

/**
 * Calculate future value using actual historical returns
 * Simulates dollar-cost averaging with actual S&P 500 monthly returns
 *
 * @param {number} initialValue - Initial investment amount
 * @param {number} monthlyInvestment - Monthly contribution amount
 * @param {number[]} monthlyReturns - Array of monthly returns
 * @param {string} startDate - Investment start date
 * @returns {Object} Results including final value, IRR, and annual summary
 */
function calculateFutureValueActual(initialValue, monthlyInvestment, monthlyReturns, dates, startDate) {
    let balance = initialValue;
    let totalInvested = initialValue;

    const balances = [initialValue];
    const yearEndData = {};
    let prevYearEndBalance = initialValue;

    const start = new Date(startDate);

    for (let i = 0; i < monthlyReturns.length; i++) {
        // Add monthly investment (skip first month)
        if (i > 0) {
            balance += monthlyInvestment;
            totalInvested += monthlyInvestment;
        }

        // Apply return
        balance = balance * (1 + monthlyReturns[i]);
        balances.push(balance);

        // Track year-end data
        const currentDate = new Date(start);
        currentDate.setMonth(currentDate.getMonth() + i);
        const year = currentDate.getFullYear();

        if (!yearEndData[year]) {
            const prevYear = year - 1;
            const prevYearData = yearEndData[prevYear];
            yearEndData[year] = {
                startBalance: prevYearData ? prevYearData.endBalance : initialValue,
                startInvested: prevYearData ? prevYearData.endInvested : initialValue
            };
        }

        yearEndData[year].endBalance = balance;
        yearEndData[year].endInvested = totalInvested;
        yearEndData[year].endDate = currentDate;
    }

    // Calculate IRR
    const cashFlows = [-initialValue];
    for (let i = 1; i < monthlyReturns.length; i++) {
        cashFlows.push(-monthlyInvestment);
    }
    cashFlows.push(balance);

    const monthlyIRR = calculateIRR(cashFlows);
    const annualizedIRR = monthlyIRR !== null ? ((Math.pow(1 + monthlyIRR, 12) - 1) * 100) : 0;

    // Build annual summary
    const annualSummary = [];
    for (const year in yearEndData) {
        const data = yearEndData[year];
        const annualReturn = ((data.endBalance - data.startBalance) / data.startBalance * 100);
        annualSummary.push({
            year: parseInt(year),
            endValue: data.endBalance,
            totalInvested: data.endInvested,
            annualReturn: annualReturn
        });
    }

    // Sort by year
    annualSummary.sort((a, b) => a.year - b.year);

    return {
        finalValue: balance,
        totalInvested,
        totalReturn: balance - totalInvested,
        returnPct: ((balance - totalInvested) / totalInvested) * 100,
        irr: annualizedIRR,
        annualSummary,
        monthlyBalances: balances
    };
}

/**
 * Calculate future value using constant annual rate
 *
 * @param {number} initialValue - Initial investment amount
 * @param {number} monthlyInvestment - Monthly contribution amount
 * @param {number} annualRate - Annual return rate (e.g., 0.10 for 10%)
 * @param {number} numMonths - Number of months to invest
 * @returns {Object} Results including final value and return
 */
function calculateFutureValueConstant(initialValue, monthlyInvestment, annualRate, numMonths) {
    const monthlyRate = Math.pow(1 + annualRate, 1/12) - 1;

    let balance = initialValue;
    let totalInvested = initialValue;
    const balances = [initialValue];

    for (let month = 0; month < numMonths; month++) {
        if (month > 0) {
            balance += monthlyInvestment;
            totalInvested += monthlyInvestment;
        }
        balance = balance * (1 + monthlyRate);
        balances.push(balance);
    }

    return {
        finalValue: balance,
        totalInvested,
        totalReturn: balance - totalInvested,
        returnPct: ((balance - totalInvested) / totalInvested) * 100,
        monthlyBalances: balances
    };
}

/**
 * Format number as currency
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

/**
 * Format number as percentage
 */
function formatPercent(value) {
    return value.toFixed(2) + '%';
}

/**
 * Display results in the summary cards
 */
function displayResults(actualResult, constantResult, comparisonRate) {
    // Show results section
    document.getElementById('resultsSection').classList.add('active');

    // Actual returns
    document.getElementById('actualFinalValue').textContent = formatCurrency(actualResult.finalValue);
    document.getElementById('actualInvested').textContent = formatCurrency(actualResult.totalInvested);
    document.getElementById('actualReturn').textContent =
        `${formatCurrency(actualResult.totalReturn)} (${formatPercent(actualResult.returnPct)})`;
    document.getElementById('actualIRR').textContent = formatPercent(actualResult.irr);

    // Constant rate
    document.getElementById('constantFinalValue').textContent = formatCurrency(constantResult.finalValue);
    document.getElementById('constantInvested').textContent = formatCurrency(constantResult.totalInvested);
    document.getElementById('constantReturn').textContent =
        `${formatCurrency(constantResult.totalReturn)} (${formatPercent(constantResult.returnPct)})`;
    document.getElementById('constantRate').textContent = formatPercent(comparisonRate * 100);

    // Difference
    const diff = actualResult.finalValue - constantResult.finalValue;
    const diffPct = (diff / constantResult.finalValue) * 100;
    const diffEl = document.getElementById('difference');
    diffEl.textContent = formatCurrency(Math.abs(diff));
    diffEl.className = 'value ' + (diff >= 0 ? 'positive' : 'negative');

    const diffText = diff > 0 ?
        `Actual returns performed BETTER than ${formatPercent(comparisonRate * 100)} annual rate` :
        `Actual returns performed WORSE than ${formatPercent(comparisonRate * 100)} annual rate`;
    document.getElementById('differenceText').textContent = diffText;

    // Scroll to results
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Display annual breakdown table
 */
function displayAnnualBreakdown(annualSummary) {
    const tbody = document.getElementById('annualTableBody');
    tbody.innerHTML = '';

    for (const row of annualSummary) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.year}</td>
            <td>${formatCurrency(row.endValue)}</td>
            <td>${formatCurrency(row.totalInvested)}</td>
            <td>${formatPercent(row.annualReturn)}</td>
        `;
        tbody.appendChild(tr);
    }
}

/**
 * Display portfolio growth chart
 */
let portfolioChart = null;

function displayChart(actualBalances, constantBalances, dates) {
    const ctx = document.getElementById('portfolioChart').getContext('2d');

    // Generate labels - use dates if available, otherwise generate
    const labels = dates && dates.length === actualBalances.length - 1 ?
        ['Start', ...dates] :
        actualBalances.map((_, i) => i === 0 ? 'Start' : `Month ${i}`);

    // Destroy existing chart
    if (portfolioChart) {
        portfolioChart.destroy();
    }

    portfolioChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Actual S&P 500 Returns',
                    data: actualBalances,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.1,
                    fill: false
                },
                {
                    label: 'Constant Rate Comparison',
                    data: constantBalances,
                    borderColor: 'rgb(156, 163, 175)',
                    backgroundColor: 'rgba(156, 163, 175, 0.1)',
                    borderDash: [5, 5],
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
                    ticks: {
                        maxTicksLimit: 20,
                        autoSkip: true
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
        const initialInvestment = parseFloat(document.getElementById('initial').value);
        const monthlyInvestment = parseFloat(document.getElementById('monthly').value);
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const comparisonRate = parseFloat(document.getElementById('rate').value) / 100;

        // Validate
        if (initialInvestment < 0 || monthlyInvestment < 0) {
            alert('Investment amounts must be positive');
            return;
        }

        if (new Date(startDate) >= new Date(endDate)) {
            alert('Start date must be before end date');
            return;
        }

        // Get monthly returns
        const { returns: monthlyReturns, dates } = getMonthlyReturns(startDate, endDate);
        const numMonths = monthlyReturns.length;

        console.log(`Calculating for ${numMonths} months from ${startDate} to ${endDate}`);
        console.log(`Initial: ${formatCurrency(initialInvestment)}, Monthly: ${formatCurrency(monthlyInvestment)}`);

        // Calculate results
        const actualResult = calculateFutureValueActual(
            initialInvestment,
            monthlyInvestment,
            monthlyReturns,
            dates,
            startDate
        );

        const constantResult = calculateFutureValueConstant(
            initialInvestment,
            monthlyInvestment,
            comparisonRate,
            numMonths
        );

        console.log('Actual final value:', formatCurrency(actualResult.finalValue));
        console.log('Actual IRR:', formatPercent(actualResult.irr));
        console.log('Constant final value:', formatCurrency(constantResult.finalValue));

        // Display
        displayResults(actualResult, constantResult, comparisonRate);
        displayAnnualBreakdown(actualResult.annualSummary);
        displayChart(
            actualResult.monthlyBalances,
            constantResult.monthlyBalances,
            dates
        );

    } catch (error) {
        alert('Error: ' + error.message);
        console.error(error);
    }
});
