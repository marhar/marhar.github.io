/**
 * Stock Returns Calculator - JavaScript Implementation
 * Replicates the Python CLI tool functionality for web
 */

/**
 * Get the available data range from the SP500 data
 */
function getDataRange() {
    const dates = Object.keys(SP500_MONTHLY_RETURNS).sort();
    return {
        firstDate: dates[0],
        lastDate: dates[dates.length - 1],
        count: dates.length
    };
}

/**
 * Validate that the selected date range is within available data
 */
function validateDateRange(startDate, endDate) {
    const dataRange = getDataRange();

    const startMonth = startDate.substring(0, 7);
    const endMonth = endDate.substring(0, 7);

    const warnings = [];

    if (startMonth < dataRange.firstDate) {
        warnings.push(`Start date is before available data (${dataRange.firstDate}). Results will begin from ${dataRange.firstDate}.`);
    }

    if (endMonth > dataRange.lastDate) {
        warnings.push(`End date extends beyond available data (${dataRange.lastDate}). Results will end at ${dataRange.lastDate}.`);
    }

    return warnings;
}

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
    const derivativeTolerance = 1e-10;
    let rate = 0.01;  // Initial guess: 1% monthly (more conservative)

    for (let i = 0; i < maxIterations; i++) {
        let npv = 0;
        let derivative = 0;

        for (let j = 0; j < cashFlows.length; j++) {
            const factor = Math.pow(1 + rate, j);
            npv += cashFlows[j] / factor;
            derivative += -j * cashFlows[j] / (factor * (1 + rate));
        }

        if (Math.abs(npv) < tolerance) {
            return rate;
        }

        if (Math.abs(derivative) < derivativeTolerance) {
            console.warn('IRR calculation failed: derivative too small');
            return null;
        }

        // Newton-Raphson step with damping to prevent divergence
        const step = npv / derivative;
        rate = rate - step;

        // Bound the rate to reasonable values
        if (rate <= -0.99) {
            rate = -0.99;  // Allow up to 99% loss
        } else if (rate > 2.0) {
            rate = 2.0;  // Cap at 200% monthly return
        }
    }

    console.warn('IRR calculation failed: did not converge after', maxIterations, 'iterations');
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
                startInvested: prevYearData ? prevYearData.endInvested : initialValue,
                contributionsThisYear: 0
            };
        }

        // Track contributions made this year (after first month)
        if (i > 0) {
            yearEndData[year].contributionsThisYear += monthlyInvestment;
        }

        yearEndData[year].endBalance = balance;
        yearEndData[year].endInvested = totalInvested;
        yearEndData[year].endDate = currentDate;
    }

    // Calculate IRR (Internal Rate of Return)
    // Cash flows: initial investment, monthly investments, final value
    // Python: cash_flows = [-initial_value] + [-monthly_investment] * (N - 1) + [final_value]
    const N = monthlyReturns.length;
    const cashFlows = [-initialValue];

    // Add (N-1) monthly investments
    for (let i = 0; i < N - 1; i++) {
        cashFlows.push(-monthlyInvestment);
    }

    // Add final value
    cashFlows.push(balance);

    const monthlyIRR = calculateIRR(cashFlows);
    const annualizedIRR = monthlyIRR !== null && monthlyIRR > -1 ? ((Math.pow(1 + monthlyIRR, 12) - 1) * 100) : 0;

    // Build annual summary
    const annualSummary = [];
    for (const year in yearEndData) {
        const data = yearEndData[year];
        const portfolioGrowth = ((data.endBalance - data.startBalance) / data.startBalance * 100);

        // Pure market return = (end balance - start balance - contributions) / start balance
        const marketGain = data.endBalance - data.startBalance - data.contributionsThisYear;
        const pureMarketReturn = (marketGain / data.startBalance * 100);

        annualSummary.push({
            year: parseInt(year),
            endValue: data.endBalance,
            totalInvested: data.endInvested,
            contributionsThisYear: data.contributionsThisYear,
            portfolioGrowth: portfolioGrowth,
            pureMarketReturn: pureMarketReturn
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
        const marketReturnClass = row.pureMarketReturn >= 0 ? 'positive' : 'negative';
        tr.innerHTML = `
            <td>${row.year}</td>
            <td>${formatCurrency(row.endValue)}</td>
            <td>${formatCurrency(row.totalInvested)}</td>
            <td class="${marketReturnClass}">${formatPercent(row.pureMarketReturn)}</td>
            <td>${formatPercent(row.portfolioGrowth)}</td>
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
 * Display data freshness indicator
 */
function displayDataFreshness() {
    const dataRange = getDataRange();
    const indicator = document.getElementById('dataFreshness');
    if (indicator) {
        indicator.textContent = `Data: ${dataRange.firstDate} to ${dataRange.lastDate} (${dataRange.count} months)`;
    }
}

/**
 * Display warnings
 */
function displayWarnings(warnings) {
    const container = document.getElementById('warningsContainer');
    if (!container) return;

    if (warnings.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    container.innerHTML = warnings.map(w => `<p>⚠️ ${w}</p>`).join('');
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
        const durationYears = parseFloat(document.getElementById('duration').value);
        const comparisonRate = parseFloat(document.getElementById('rate').value) / 100;

        // Validate
        if (initialInvestment < 0 || monthlyInvestment < 0) {
            alert('Investment amounts must be positive');
            return;
        }

        if (durationYears <= 0) {
            alert('Duration must be greater than 0');
            return;
        }

        // Calculate end date from start date + duration
        const start = new Date(startDate);
        const end = new Date(start);
        end.setMonth(end.getMonth() + Math.round(durationYears * 12));

        // Format end date as YYYY-MM-DD
        const endDate = end.toISOString().split('T')[0];

        // Validate date range and show warnings
        const warnings = validateDateRange(startDate, endDate);
        displayWarnings(warnings);

        // Get monthly returns
        const { returns: monthlyReturns, dates } = getMonthlyReturns(startDate, endDate);
        const numMonths = monthlyReturns.length;

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

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    displayDataFreshness();

    // Update date input constraints based on available data
    const dataRange = getDataRange();
    const startInput = document.getElementById('startDate');
    if (startInput) {
        startInput.min = dataRange.firstDate + '-01';
    }
});
