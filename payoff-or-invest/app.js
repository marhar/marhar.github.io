// Buy House Calculator - JavaScript Implementation
// Compares paying cash vs. getting mortgage using historical S&P 500 data

let sp500Data = null;
let comparisonChart = null;
let cachedReturns = null;
let cachedParams = null;

// Mortgage calculation functions
function calculateMonthlyPayment(balance, rateAnnual, termYears) {
    const rateMonthly = rateAnnual / 12;
    const numPayments = termYears * 12;

    if (rateMonthly === 0) {
        return balance / numPayments;
    }

    const payment = balance * (rateMonthly * Math.pow(1 + rateMonthly, numPayments)) /
                    (Math.pow(1 + rateMonthly, numPayments) - 1);
    return payment;
}

function calculateTotalInterest(balance, rateAnnual, termYears) {
    const payment = calculateMonthlyPayment(balance, rateAnnual, termYears);
    const totalPaid = payment * termYears * 12;
    return totalPaid - balance;
}

// Investment calculation with historical returns
function calculateInvestmentMonthly(monthlyAmount, monthlyReturns) {
    let totalValue = 0;
    const numMonths = monthlyReturns.length;

    for (let i = 0; i < numMonths; i++) {
        let investment = monthlyAmount;
        // This investment grows for the remaining months
        for (let j = i; j < numMonths; j++) {
            investment *= (1 + monthlyReturns[j]);
        }
        totalValue += investment;
    }

    return totalValue;
}

function calculateInvestmentLumpSum(amount, monthlyReturns) {
    let value = amount;
    for (const monthlyReturn of monthlyReturns) {
        value *= (1 + monthlyReturn);
    }
    return value;
}

// Scenario calculations
function scenarioPayCash(balance, mortgageRate, termYears, monthlyReturns, trackMonthly = false) {
    const monthlyPayment = calculateMonthlyPayment(balance, mortgageRate, termYears);

    if (trackMonthly) {
        const monthlyData = [];
        const numMonths = monthlyReturns.length;

        for (let month = 0; month < numMonths; month++) {
            const totalInvested = monthlyPayment * (month + 1);
            let investmentValue = 0;

            for (let i = 0; i <= month; i++) {
                let investment = monthlyPayment;
                for (let j = i; j <= month; j++) {
                    investment *= (1 + monthlyReturns[j]);
                }
                investmentValue += investment;
            }

            const totalValue = balance + investmentValue;
            monthlyData.push({
                month: month + 1,
                invested: totalInvested,
                investmentValue: investmentValue,
                totalValue: totalValue
            });
        }

        const finalValue = monthlyData[monthlyData.length - 1].totalValue;
        const finalInvestment = monthlyData[monthlyData.length - 1].investmentValue;
        return { finalValue, finalInvestment, monthlyData };
    } else {
        const investmentValue = calculateInvestmentMonthly(monthlyPayment, monthlyReturns);
        const totalValue = balance + investmentValue;
        return { finalValue: totalValue, finalInvestment: investmentValue, monthlyData: null };
    }
}

function scenarioPayCashNoInvest(balance, termYears, trackMonthly = false) {
    // Scenario 3: Pay cash for home, make no investments
    // Just own the home, no investment growth

    if (trackMonthly) {
        const numMonths = termYears * 12;
        const monthlyData = [];

        for (let month = 0; month < numMonths; month++) {
            monthlyData.push({
                month: month + 1,
                investmentValue: 0,
                totalValue: balance
            });
        }

        return { finalValue: balance, finalInvestment: 0, monthlyData };
    } else {
        return { finalValue: balance, finalInvestment: 0, monthlyData: null };
    }
}

function scenarioInvest(balance, mortgageRate, termYears, monthlyReturns, trackMonthly = false) {
    const monthlyPayment = calculateMonthlyPayment(balance, mortgageRate, termYears);
    const totalInterest = calculateTotalInterest(balance, mortgageRate, termYears);

    if (trackMonthly) {
        const monthlyData = [];
        const numMonths = monthlyReturns.length;
        const rateMonthly = mortgageRate / 12;
        let principalRemaining = balance;
        let interestPaid = 0;
        let investmentValue = balance; // Start with lump sum investment
        let ranOutOfMoney = false;
        let ranOutMonth = null;
        let additionalPaymentsNeeded = 0; // Track payments needed after investment depletes

        for (let month = 0; month < numMonths; month++) {
            // Apply market return for this month
            investmentValue *= (1 + monthlyReturns[month]);

            // THEN withdraw the mortgage payment (if we have enough)
            if (investmentValue >= monthlyPayment) {
                investmentValue -= monthlyPayment;
            } else {
                // Can't make full payment from investment
                if (!ranOutOfMoney) {
                    ranOutOfMoney = true;
                    ranOutMonth = month + 1;
                }

                // If investment is positive but less than payment, use what's left
                if (investmentValue > 0) {
                    additionalPaymentsNeeded += (monthlyPayment - investmentValue);
                    investmentValue = 0;
                } else {
                    // Investment already at zero, need full payment from elsewhere
                    additionalPaymentsNeeded += monthlyPayment;
                }
            }

            // Track mortgage status
            const interestPayment = principalRemaining * rateMonthly;
            const principalPayment = monthlyPayment - interestPayment;
            interestPaid += interestPayment;
            principalRemaining -= principalPayment;

            // Total value = home + investment - interest paid so far
            const totalValue = balance + investmentValue - interestPaid;

            monthlyData.push({
                month: month + 1,
                investmentValue: investmentValue,
                interestPaid: interestPaid,
                principalRemaining: Math.max(0, principalRemaining),
                totalValue: totalValue,
                ranOutOfMoney: investmentValue < 0
            });
        }

        const finalValue = monthlyData[monthlyData.length - 1].totalValue;
        const finalInvestment = monthlyData[monthlyData.length - 1].investmentValue;
        return {
            finalValue,
            finalInvestment,
            monthlyData,
            ranOutOfMoney,
            ranOutMonth,
            additionalPaymentsNeeded
        };
    } else {
        // For non-tracked calculation, we need to calculate with withdrawals too
        let investmentValue = balance;
        const numMonths = monthlyReturns.length;

        for (let month = 0; month < numMonths; month++) {
            investmentValue *= (1 + monthlyReturns[month]);
            investmentValue -= monthlyPayment;
        }

        const totalValue = balance - totalInterest + investmentValue;
        return { finalValue: totalValue, finalInvestment: investmentValue, monthlyData: null };
    }
}

// Get real historical S&P 500 data from embedded dataset
function getRealSP500Returns(startYear, numMonths) {
    // SP500_MONTHLY_RETURNS is loaded from sp500_data.js
    // IMPORTANT: The Python original starts from {year}-01-01 but pct_change() drops
    // the first month, so data actually starts from February of the start year
    const returns = [];

    // Find the starting month - start from February to match Python behavior
    let currentYear = startYear;
    let currentMonth = 2; // Start in FEBRUARY (not January!) to match Python

    for (let i = 0; i < numMonths; i++) {
        const dateKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

        if (SP500_MONTHLY_RETURNS[dateKey] !== undefined) {
            returns.push(SP500_MONTHLY_RETURNS[dateKey]);
        } else {
            console.warn(`No data found for ${dateKey}`);
            // If we run out of data, stop
            break;
        }

        // Move to next month
        currentMonth++;
        if (currentMonth > 12) {
            currentMonth = 1;
            currentYear++;
        }
    }

    return returns;
}

// Main comparison function
async function compareScenarios(balance, mortgageRate, termYears, startYear, trackMonthly = false) {
    const numMonths = termYears * 12;

    // Check if we can use cached returns
    const paramsKey = `${startYear}-${numMonths}`;
    let monthlyReturns;

    if (cachedParams === paramsKey && cachedReturns) {
        console.log('Using cached market returns');
        monthlyReturns = cachedReturns;
    } else {
        // Use real historical data
        monthlyReturns = getRealSP500Returns(startYear, numMonths);

        if (monthlyReturns.length < numMonths) {
            throw new Error(`Insufficient historical data. Requested ${numMonths} months starting ${startYear}, but only ${monthlyReturns.length} months available.`);
        }

        console.log(`Loaded ${monthlyReturns.length} months of real S&P 500 data starting from ${startYear}`);

        // Cache the returns
        cachedReturns = monthlyReturns;
        cachedParams = paramsKey;
    }

    const monthlyPayment = calculateMonthlyPayment(balance, mortgageRate, termYears);
    const totalInterest = calculateTotalInterest(balance, mortgageRate, termYears);

    const scenario1 = scenarioPayCash(balance, mortgageRate, termYears, monthlyReturns, trackMonthly);
    const scenario2 = scenarioInvest(balance, mortgageRate, termYears, monthlyReturns, trackMonthly);
    const scenario3 = scenarioPayCashNoInvest(balance, termYears, trackMonthly);

    // Calculate average annual return
    let cumulativeReturn = 1.0;
    for (const r of monthlyReturns) {
        cumulativeReturn *= (1 + r);
    }
    const avgAnnualReturn = Math.pow(cumulativeReturn, 1 / termYears) - 1;

    // Check for dangerous conditions in Scenario 2
    let minScenario2Value = scenario2.finalValue;
    let minScenario2Month = null;
    let wentNegative = false;

    // PRIMARY DANGER: Investment < Principal (can't pay off mortgage)
    let minInvestmentVsPrincipal = Infinity;
    let minIvPMonth = null;
    let cantPayOffMortgage = false;
    let monthsUnderwater = 0;

    // Additional useful metrics
    let peakInvestment = balance;
    let maxDrawdown = 0;
    let maxDrawdownMonth = null;
    let monthsInvestmentBelowInterest = 0;
    let recoveredToInitial = false;
    let recoveryMonth = null;

    if (scenario2.monthlyData) {
        for (const m of scenario2.monthlyData) {
            // Track total value minimum (secondary metric)
            if (m.totalValue < minScenario2Value) {
                minScenario2Value = m.totalValue;
                minScenario2Month = m.month;
            }
            if (m.totalValue < 0) {
                wentNegative = true;
            }

            // Track investment vs principal (PRIMARY metric)
            const investmentVsPrincipal = m.investmentValue - m.principalRemaining;
            if (investmentVsPrincipal < minInvestmentVsPrincipal) {
                minInvestmentVsPrincipal = investmentVsPrincipal;
                minIvPMonth = m.month;
            }
            if (investmentVsPrincipal < 0) {
                cantPayOffMortgage = true;
                monthsUnderwater++;
            }

            // Track peak and drawdown
            if (m.investmentValue > peakInvestment) {
                peakInvestment = m.investmentValue;
                // Check if recovered to initial
                if (!recoveredToInitial && m.investmentValue >= balance) {
                    recoveredToInitial = true;
                    recoveryMonth = m.month;
                }
            }
            const drawdown = (m.investmentValue - peakInvestment) / peakInvestment;
            if (drawdown < maxDrawdown) {
                maxDrawdown = drawdown;
                maxDrawdownMonth = m.month;
            }

            // Check if investment < interest paid
            if (m.investmentValue < m.interestPaid) {
                monthsInvestmentBelowInterest++;
            }
        }
    }

    return {
        monthlyPayment,
        totalInterest,
        scenario1Value: scenario1.finalValue,
        scenario1Investment: scenario1.finalInvestment,
        scenario1Monthly: scenario1.monthlyData,
        scenario2Value: scenario2.finalValue,
        scenario2Investment: scenario2.finalInvestment,
        scenario2Monthly: scenario2.monthlyData,
        scenario3Value: scenario3.finalValue,
        scenario3Investment: scenario3.finalInvestment,
        scenario3Monthly: scenario3.monthlyData,
        difference: scenario2.finalValue - scenario1.finalValue,
        avgAnnualReturn,
        numMonths: monthlyReturns.length,
        startYear: startYear,
        // Total value metrics (secondary)
        minScenario2Value: minScenario2Value,
        minScenario2Month: minScenario2Month,
        wentNegative: wentNegative,
        // Investment vs Principal metrics (PRIMARY)
        minInvestmentVsPrincipal: minInvestmentVsPrincipal,
        minIvPMonth: minIvPMonth,
        cantPayOffMortgage: cantPayOffMortgage,
        monthsUnderwater: monthsUnderwater,
        // Ran out of money (CRITICAL - can't make payments)
        ranOutOfMoney: scenario2.ranOutOfMoney || false,
        ranOutMonth: scenario2.ranOutMonth || null,
        additionalPaymentsNeeded: scenario2.additionalPaymentsNeeded || 0,
        // Additional useful metrics
        maxDrawdown: maxDrawdown,
        maxDrawdownMonth: maxDrawdownMonth,
        peakInvestment: peakInvestment,
        monthsInvestmentBelowInterest: monthsInvestmentBelowInterest,
        recoveredToInitial: recoveredToInitial,
        recoveryMonth: recoveryMonth
    };
}

// Format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

// Format percentage
function formatPercent(value) {
    return (value * 100).toFixed(2) + '%';
}

// Display results
function displayResults(results) {
    const infoBox = document.getElementById('infoBox');
    const summaryCards = document.getElementById('summaryCards');

    let warningHtml = '';

    // Check for notable conditions - PRIORITY ORDER
    // 1. Ran out of money (Investment < $0) - CATASTROPHIC - Can't make mortgage payments!
    // 2. Can't pay off mortgage (Investment < Principal) - CRITICAL
    // 3. Total value negative
    // 4. Severe drawdown

    if (results.ranOutOfMoney) {
        const yearOfRanOut = results.startYear + Math.floor((results.ranOutMonth - 1) / 12);
        const monthOfRanOut = ((results.ranOutMonth - 1) % 12) + 1;
        const yearsBeforeRunOut = (results.ranOutMonth / 12).toFixed(1);
        const monthsRemaining = results.numMonths - results.ranOutMonth;
        const yearsRemaining = (monthsRemaining / 12).toFixed(1);

        warningHtml = `
            <div style="background: #fff3e0; border: 2px solid #ff9800; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <h3 style="color: #e65100; margin: 0 0 10px 0;">Note: Investment Depleted</h3>
                <p style="margin: 5px 0;"><strong>Investment balance reached $0:</strong> ${yearOfRanOut}-${String(monthOfRanOut).padStart(2, '0')} (Month ${results.ranOutMonth})</p>
                <p style="margin: 5px 0;"><strong>Time until depletion:</strong> ${yearsBeforeRunOut} years</p>
                <p style="margin: 5px 0;"><strong>Remaining mortgage term:</strong> ${yearsRemaining} years (${monthsRemaining} payments)</p>
                <p style="margin: 5px 0;"><strong>Additional payments needed:</strong> ${formatCurrency(results.additionalPaymentsNeeded)}</p>
            </div>
        `;
    } else if (results.wentNegative) {
        const yearOfMin = results.startYear + Math.floor((results.minScenario2Month - 1) / 12);
        const monthOfMin = ((results.minScenario2Month - 1) % 12) + 1;

        warningHtml = `
            <div style="background: #fff3e0; border: 2px solid #ff9800; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <h3 style="color: #e65100; margin: 0 0 10px 0;">Note: Negative Total Value</h3>
                <p style="margin: 5px 0;"><strong>Minimum value:</strong> ${formatCurrency(results.minScenario2Value)}</p>
                <p style="margin: 5px 0;"><strong>Occurred:</strong> ${yearOfMin}-${String(monthOfMin).padStart(2, '0')} (Month ${results.minScenario2Month})</p>
            </div>
        `;
    } else if (results.scenario2Value < 0) {
        warningHtml = `
            <div style="background: #fff3e0; border: 2px solid #ff9800; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <h3 style="color: #e65100; margin: 0 0 10px 0;">Note: Scenario 2 Final Value is Negative</h3>
                <p style="margin: 5px 0;"><strong>Final value:</strong> ${formatCurrency(results.scenario2Value)}</p>
            </div>
        `;
    } else if (results.minScenario2Value < results.scenario2Value * 0.5) {
        const yearOfMin = results.startYear + Math.floor((results.minScenario2Month - 1) / 12);
        const monthOfMin = ((results.minScenario2Month - 1) % 12) + 1;

        warningHtml = `
            <div style="background: #e3f2fd; border: 2px solid #2196f3; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <h3 style="color: #1976d2; margin: 0 0 10px 0;">Note: Significant Drawdown</h3>
                <p style="margin: 5px 0;"><strong>Lowest point:</strong> ${formatCurrency(results.minScenario2Value)} at ${yearOfMin}-${String(monthOfMin).padStart(2, '0')}</p>
                <p style="margin: 5px 0;">Total value dropped to ${((results.minScenario2Value / results.scenario2Value) * 100).toFixed(0)}% of the final value during the period.</p>
            </div>
        `;
    }

    infoBox.innerHTML = warningHtml + `
        <strong>Calculation Details:</strong><br>
        <strong>Data:</strong> Real S&P 500 returns starting February ${results.startYear}<br>
        Monthly Payment Formula: P = B × [r(1+r)^n] / [(1+r)^n - 1]<br>
        Monthly Payment: ${formatCurrency(results.monthlyPayment)}<br>
        Total Interest Over Term: ${formatCurrency(results.totalInterest)}<br>
        Actual Average Annual Return: ${formatPercent(results.avgAnnualReturn)}<br>
        Data Points Used: ${results.numMonths} months of actual market data
    `;

    // Determine winner among all 3 scenarios
    const values = [results.scenario1Value, results.scenario2Value, results.scenario3Value];
    const maxValue = Math.max(...values);
    const winner = values.indexOf(maxValue) + 1;

    summaryCards.innerHTML = `
        <div class="card ${winner === 1 ? 'winner' : ''}">
            <h3>Scenario 1: Pay Cash + Invest</h3>
            <div class="label">Investment Growth</div>
            <div class="value">${formatCurrency(results.scenario1Investment)}</div>
            <div class="label">Final Value</div>
            <div class="value">${formatCurrency(results.scenario1Value)}</div>
        </div>

        <div class="card ${winner === 2 ? 'winner' : ''}">
            <h3>Scenario 2: Mortgage + Invest</h3>
            <div class="label">Investment Growth</div>
            <div class="value">${formatCurrency(results.scenario2Investment)}</div>
            <div class="label">Interest Paid</div>
            <div class="value" style="font-size: 1.2em; color: #ff6b6b;">${formatCurrency(results.totalInterest)}</div>
            ${results.additionalPaymentsNeeded > 0 ? `
            <div class="label">Additional Payments Needed</div>
            <div class="value" style="font-size: 1.2em; color: #ff9800;">${formatCurrency(results.additionalPaymentsNeeded)}</div>
            ` : ''}
            <div class="label">Final Value</div>
            <div class="value">${formatCurrency(results.scenario2Value)}</div>
        </div>

        <div class="card ${winner === 3 ? 'winner' : ''}">
            <h3>Scenario 3: Pay Cash Only</h3>
            <div class="label">No Investments</div>
            <div class="value">Just own the home</div>
            <div class="label">Final Value</div>
            <div class="value">${formatCurrency(results.scenario3Value)}</div>
        </div>
    `;

    document.getElementById('resultsDiv').classList.add('active');
}

// Display monthly progress chart
function displayMonthlyChart(results, startYear) {
    const chartContainer = document.getElementById('chartContainer');
    const canvas = document.getElementById('comparisonChart');

    if (!results.scenario1Monthly || !results.scenario2Monthly) {
        chartContainer.style.display = 'none';
        return;
    }

    chartContainer.style.display = 'block';

    const labels = results.scenario1Monthly.map(d => {
        const year = startYear + Math.floor((d.month - 1) / 12);
        const month = ((d.month - 1) % 12) + 1;
        return `${year}-${month.toString().padStart(2, '0')}`;
    });

    // Destroy existing chart
    if (comparisonChart) {
        comparisonChart.destroy();
    }

    // Check if any Scenario 2 investment values are negative
    const hasNegatives = results.scenario2Monthly.some(d => d.investmentValue < 0);

    const ctx = canvas.getContext('2d');
    comparisonChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Scenario 1: Investment Value',
                    data: results.scenario1Monthly.map(d => d.investmentValue),
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Scenario 2: Investment Value',
                    data: results.scenario2Monthly.map(d => d.investmentValue < 0 ? null : d.investmentValue),
                    borderColor: hasNegatives ? '#c33' : '#38ef7d',
                    backgroundColor: hasNegatives ? 'rgba(204, 51, 51, 0.1)' : 'rgba(56, 239, 125, 0.1)',
                    tension: 0.4,
                    spanGaps: false  // Don't connect across null values
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
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
                    },
                    grid: {
                        color: function(context) {
                            // Make zero line prominent if we have negative values
                            if (context.tick.value === 0 && hasNegatives) {
                                return '#c33';
                            }
                            return 'rgba(0, 0, 0, 0.1)';
                        },
                        lineWidth: function(context) {
                            if (context.tick.value === 0 && hasNegatives) {
                                return 3;
                            }
                            return 1;
                        }
                    }
                },
                x: {
                    ticks: {
                        maxTicksLimit: 12
                    }
                }
            }
        }
    });
}

// Display monthly table
function displayMonthlyTable(results, startYear) {
    const tableDiv = document.getElementById('monthlyTable');

    if (!results.scenario1Monthly || !results.scenario2Monthly) {
        tableDiv.innerHTML = '';
        return;
    }

    const termYears = results.scenario1Monthly.length / 12;
    const showEveryMonth = termYears <= 15;

    let html = '<h3>Month-by-Month Progress</h3>';
    html += '<table><thead><tr>';
    html += '<th>Month</th><th>Year</th>';
    html += '<th>S1: Invested</th><th>S1: Inv Value</th><th>S1: Total</th>';
    html += '<th>S2: Inv Value</th><th>S2: Int Paid</th><th>S2: Total</th>';
    html += '<th>Better</th>';
    html += '</tr></thead><tbody>';

    results.scenario1Monthly.forEach((m1, i) => {
        const m2 = results.scenario2Monthly[i];
        const month = m1.month;
        const year = startYear + Math.floor((month - 1) / 12);

        if (showEveryMonth || month % 12 === 0 || month === results.scenario1Monthly.length) {
            const diff = m2.totalValue - m1.totalValue;
            const better = diff > 0 ? 'Mortgage' : (diff < 0 ? 'Pay Cash' : 'Tie');
            let rowClass = diff > 0 ? 'better-mortgage' : 'better-cash';

            // Override class if Scenario 2 is negative (critical warning)
            let specialStyle = '';
            let warningEmoji = '';

            if (m2.investmentValue < 0) {
                // CATASTROPHIC: Ran out of money, can't make payments
                rowClass = 'better-cash';
                specialStyle = 'style="background: #800 !important; color: white; border-left: 4px solid #f00; font-weight: bold;"';
                warningEmoji = ' 💀';
            } else if (m2.totalValue < 0) {
                // WARNING: Total value negative
                rowClass = 'better-cash';
                specialStyle = 'style="background: #fee !important; border-left: 4px solid #c33;"';
                warningEmoji = ' ⚠️';
            }

            html += `<tr class="${rowClass}" ${specialStyle}>`;
            html += `<td>${month}</td><td>${year}</td>`;
            html += `<td>${formatCurrency(m1.invested)}</td>`;
            html += `<td>${formatCurrency(m1.investmentValue)}</td>`;
            html += `<td>${formatCurrency(m1.totalValue)}</td>`;
            html += `<td style="font-weight: bold; color: ${m2.investmentValue < 0 ? '#f00' : 'inherit'}">${formatCurrency(m2.investmentValue)}</td>`;
            html += `<td>${formatCurrency(m2.interestPaid)}</td>`;
            html += `<td style="font-weight: bold; color: ${m2.totalValue < 0 ? '#c33' : 'inherit'}">${formatCurrency(m2.totalValue)}</td>`;
            html += `<td>${better}${warningEmoji}</td>`;
            html += '</tr>';
        }
    });

    html += '</tbody></table>';
    tableDiv.innerHTML = html;
}

// Clear cache when inputs change
function clearCache() {
    cachedReturns = null;
    cachedParams = null;
}

document.getElementById('balance').addEventListener('change', clearCache);
document.getElementById('rate').addEventListener('change', clearCache);
document.getElementById('term').addEventListener('change', clearCache);
document.getElementById('startYear').addEventListener('change', clearCache);

// Event handler - Calculate Comparison (always shows monthly progress)
document.getElementById('calculateBtn').addEventListener('click', async () => {
    const balance = parseFloat(document.getElementById('balance').value);
    const rate = parseFloat(document.getElementById('rate').value) / 100;
    const term = parseInt(document.getElementById('term').value);
    const startYear = parseInt(document.getElementById('startYear').value);

    const loadingDiv = document.getElementById('loadingDiv');
    const errorDiv = document.getElementById('errorDiv');
    const resultsDiv = document.getElementById('resultsDiv');

    loadingDiv.style.display = 'block';
    errorDiv.style.display = 'none';
    resultsDiv.classList.remove('active');

    try {
        // Always track monthly for warnings and charts
        const results = await compareScenarios(balance, rate, term, startYear, true);
        loadingDiv.style.display = 'none';
        displayResults(results);
        displayMonthlyChart(results, startYear);
        displayMonthlyTable(results, startYear);
    } catch (error) {
        loadingDiv.style.display = 'none';
        errorDiv.textContent = 'Error: ' + error.message;
        errorDiv.style.display = 'block';
    }
});

document.getElementById('riskBtn').addEventListener('click', async () => {
    const balance = parseFloat(document.getElementById('balance').value);
    const rate = parseFloat(document.getElementById('rate').value) / 100;
    const term = parseInt(document.getElementById('term').value);

    const loadingDiv = document.getElementById('loadingDiv');
    const errorDiv = document.getElementById('errorDiv');
    const riskResults = document.getElementById('riskResults');

    loadingDiv.style.display = 'block';
    errorDiv.style.display = 'none';
    riskResults.innerHTML = '';

    try {
        // Analyze all possible starting years
        const results = await analyzeAllPeriods(balance, rate, term);
        displayRiskAnalysis(results, balance, rate, term);
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
    } finally {
        loadingDiv.style.display = 'none';
    }
});

async function analyzeAllPeriods(balance, mortgageRate, termYears) {
    const numMonths = termYears * 12;
    const allDates = Object.keys(SP500_MONTHLY_RETURNS).sort();

    // Find all valid starting years (that have enough data)
    const startYears = [];
    for (let i = 0; i < allDates.length - numMonths; i += 12) {
        const dateKey = allDates[i];
        const year = parseInt(dateKey.split('-')[0]);
        if (dateKey.endsWith('-02')) { // Only February starts
            startYears.push(year);
        }
    }

    console.log(`Analyzing ${startYears.length} starting years...`);

    const analyses = [];

    for (const startYear of startYears) {
        const result = await compareScenarios(balance, mortgageRate, termYears, startYear, false);

        analyses.push({
            year: startYear,
            s1: result.scenario1Value,
            s2: result.scenario2Value,
            s3: result.scenario3Value,
            s2Better: result.scenario2Value > result.scenario1Value,
            s2BetterThanS3: result.scenario2Value > result.scenario3Value,
            ranOut: result.ranOutOfMoney,
            additionalPayments: result.additionalPaymentsNeeded
        });
    }

    return analyses;
}

function displayRiskAnalysis(analyses, balance, rate, term) {
    const riskResults = document.getElementById('riskResults');

    // Calculate statistics
    const total = analyses.length;
    const s2Wins = analyses.filter(a => a.s2Better).length;
    const s2WinsVsS3 = analyses.filter(a => a.s2BetterThanS3).length;
    const s2RanOut = analyses.filter(a => a.ranOut).length;
    const s2Doom = analyses.filter(a => a.s2 < a.s3).length;

    const s2WinRate = (s2Wins / total * 100).toFixed(1);
    const s2WinRateVsS3 = (s2WinsVsS3 / total * 100).toFixed(1);
    const s2RanOutRate = (s2RanOut / total * 100).toFixed(1);
    const s2DoomRate = (s2Doom / total * 100).toFixed(1);

    // Find best and worst scenarios
    const sortedByS2 = [...analyses].sort((a, b) => b.s2 - a.s2);
    const best = sortedByS2[0];
    const worst = sortedByS2[sortedByS2.length - 1];

    // Find doom scenarios (S2 < S3)
    const doomScenarios = analyses.filter(a => a.s2 < a.s3).sort((a, b) => a.s2 - b.s2);

    let html = `
        <div style="margin-top: 30px;">
            <h2>Risk Analysis: All Historical Periods</h2>
            <p>Analyzed ${total} different starting years (${analyses[0].year} - ${analyses[total-1].year})</p>
            <p>Parameters: $${balance.toLocaleString()} home, ${(rate*100).toFixed(1)}% rate, ${term} years</p>

            <div class="summary-cards" style="margin-top: 20px;">
                <div class="card">
                    <h3>Scenario 2 vs Scenario 1</h3>
                    <div class="label">S2 Wins</div>
                    <div class="value">${s2Wins} of ${total}</div>
                    <div class="label">Win Rate</div>
                    <div class="value" style="color: ${s2WinRate > 50 ? '#38ef7d' : '#ff6b6b'}">${s2WinRate}%</div>
                </div>

                <div class="card">
                    <h3>Scenario 2 vs Scenario 3</h3>
                    <div class="label">S2 Better Than Doing Nothing</div>
                    <div class="value">${s2WinsVsS3} of ${total}</div>
                    <div class="label">Success Rate</div>
                    <div class="value" style="color: ${s2WinRateVsS3 > 50 ? '#38ef7d' : '#ff6b6b'}">${s2WinRateVsS3}%</div>
                </div>

                <div class="card" style="background: #fff3e0; border-color: #ff9800;">
                    <h3>Investment Depletion Risk</h3>
                    <div class="label">Periods Where Investment Depleted</div>
                    <div class="value" style="color: #e65100;">${s2RanOut} of ${total}</div>
                    <div class="label">Depletion Rate</div>
                    <div class="value" style="color: #e65100;">${s2RanOutRate}%</div>
                </div>

                <div class="card" style="background: ${s2Doom > 0 ? '#fee' : '#e8f5e9'}; border-color: ${s2Doom > 0 ? '#c33' : '#4caf50'};">
                    <h3>Doom Scenarios</h3>
                    <div class="label">S2 Worse Than Doing Nothing</div>
                    <div class="value" style="color: ${s2Doom > 0 ? '#c33' : '#4caf50'};">${s2Doom} of ${total}</div>
                    <div class="label">Doom Rate</div>
                    <div class="value" style="color: ${s2Doom > 0 ? '#c33' : '#4caf50'};">${s2DoomRate}%</div>
                </div>
            </div>

            <div style="margin-top: 30px;">
                <h3>Best Case (Highest S2 Value)</h3>
                <p>Starting year: ${best.year}</p>
                <p>Scenario 2 value: ${formatCurrency(best.s2)}</p>
            </div>

            <div style="margin-top: 20px;">
                <h3>Worst Case (Lowest S2 Value)</h3>
                <p>Starting year: ${worst.year}</p>
                <p>Scenario 2 value: ${formatCurrency(worst.s2)}</p>
                ${worst.ranOut ? `<p style="color: #e65100;">Investment depleted, additional payments needed: ${formatCurrency(worst.additionalPayments)}</p>` : ''}
            </div>
    `;

    if (doomScenarios.length > 0) {
        html += `
            <div style="margin-top: 30px; background: #fff3e0; border: 2px solid #ff9800; border-radius: 8px; padding: 20px;">
                <h3 style="color: #e65100;">Doom Scenarios (S2 < S3)</h3>
                <p>In ${doomScenarios.length} periods, Scenario 2 ended up worse than just paying cash and doing nothing:</p>
                <table style="width: 100%; margin-top: 15px;">
                    <thead>
                        <tr>
                            <th>Start Year</th>
                            <th>S2 Value</th>
                            <th>S3 Value</th>
                            <th>Worse By</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        for (const doom of doomScenarios) {
            html += `
                <tr>
                    <td>${doom.year}</td>
                    <td style="color: #c33;">${formatCurrency(doom.s2)}</td>
                    <td>${formatCurrency(doom.s3)}</td>
                    <td style="color: #c33;">${formatCurrency(doom.s3 - doom.s2)}</td>
                </tr>
            `;
        }

        html += `
                    </tbody>
                </table>
            </div>
        `;
    }

    html += `
        <div style="margin-top: 30px;">
            <h3>All Historical Periods</h3>
            <canvas id="riskChart" style="max-height: 400px;"></canvas>
        </div>
    `;

    html += '</div>';

    riskResults.innerHTML = html;
    document.getElementById('resultsDiv').classList.add('active');

    // Create chart after DOM is updated
    setTimeout(() => displayRiskChart(analyses, balance), 0);
}

function displayRiskChart(analyses, balance) {
    const canvas = document.getElementById('riskChart');
    if (!canvas) {
        console.error('Risk chart canvas not found');
        return;
    }

    console.log('Creating risk chart with', analyses.length, 'data points');

    const ctx = canvas.getContext('2d');

    // Destroy existing chart if any
    if (window.riskChart && typeof window.riskChart.destroy === 'function') {
        window.riskChart.destroy();
    }

    const years = analyses.map(a => a.year);
    const s1Values = analyses.map(a => a.s1);
    const s2Values = analyses.map(a => a.s2);
    const s3Values = analyses.map(a => a.s3);

    window.riskChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'Scenario 1: Pay Cash + Invest',
                    data: s1Values,
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.1
                },
                {
                    label: 'Scenario 2: Mortgage + Invest',
                    data: s2Values,
                    borderColor: '#38ef7d',
                    backgroundColor: 'rgba(56, 239, 125, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.1,
                    segment: {
                        borderColor: ctx => {
                            const idx = ctx.p1DataIndex;
                            const s2 = analyses[idx].s2;
                            const s3 = analyses[idx].s3;
                            // Red if worse than doing nothing
                            return s2 < s3 ? '#c33' : '#38ef7d';
                        }
                    }
                },
                {
                    label: 'Scenario 3: Pay Cash Only (Baseline)',
                    data: s3Values,
                    borderColor: '#2196f3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    tension: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        title: function(context) {
                            return 'Starting Year: ' + context[0].label;
                        },
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        },
                        afterLabel: function(context) {
                            const idx = context.dataIndex;
                            if (context.datasetIndex === 1) { // S2
                                const analysis = analyses[idx];
                                let extra = [];
                                if (analysis.ranOut) {
                                    extra.push('Investment depleted');
                                }
                                if (analysis.s2 < analysis.s3) {
                                    extra.push('Worse than doing nothing');
                                }
                                return extra.length > 0 ? extra.join(', ') : '';
                            }
                            return '';
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
                    },
                    grid: {
                        color: function(context) {
                            // Highlight baseline (S3 value)
                            if (context.tick.value === balance) {
                                return '#2196f3';
                            }
                            // Highlight zero line
                            if (context.tick.value === 0) {
                                return '#c33';
                            }
                            return 'rgba(0, 0, 0, 0.1)';
                        },
                        lineWidth: function(context) {
                            if (context.tick.value === balance || context.tick.value === 0) {
                                return 2;
                            }
                            return 1;
                        }
                    }
                },
                x: {
                    ticks: {
                        maxTicksLimit: 20,
                        callback: function(value, index) {
                            // Show every 5 years
                            const year = this.getLabelForValue(value);
                            return year % 5 === 0 ? year : '';
                        }
                    }
                }
            }
        }
    });
}
