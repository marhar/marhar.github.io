// Mortgage Payoff Calculator v2
// Compares: Invest lump sum (drawdown) vs Pay off mortgage (contribute monthly)

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate monthly mortgage payment
 * @param {number} balance - Loan amount
 * @param {number} annualRate - Annual interest rate (e.g., 0.06 for 6%)
 * @param {number} years - Loan term in years
 * @returns {number} Monthly payment
 */
function calculateMonthlyPayment(balance, annualRate, years) {
    const monthlyRate = annualRate / 12;
    const numPayments = years * 12;

    if (monthlyRate === 0) {
        return balance / numPayments;
    }

    return balance * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
           (Math.pow(1 + monthlyRate, numPayments) - 1);
}

/**
 * Get monthly S&P 500 returns for a period starting at a given year/month
 * @param {number} startYear - Starting year
 * @param {number} startMonth - Starting month (1-12)
 * @param {number} numMonths - Number of months needed
 * @returns {number[]|null} Array of monthly returns, or null if insufficient data
 */
function getMonthlyReturns(startYear, startMonth, numMonths) {
    const returns = [];
    let year = startYear;
    let month = startMonth;

    for (let i = 0; i < numMonths; i++) {
        const key = `${year}-${String(month).padStart(2, '0')}`;
        if (!(key in SP500_MONTHLY_RETURNS)) {
            return null; // Insufficient data
        }
        returns.push(SP500_MONTHLY_RETURNS[key]);

        month++;
        if (month > 12) {
            month = 1;
            year++;
        }
    }

    return returns;
}

/**
 * Scenario A: Invest the lump sum, withdraw monthly for mortgage payments
 * @param {number} balance - Mortgage balance (also the lump sum)
 * @param {number} annualRate - Mortgage interest rate
 * @param {number} years - Mortgage term
 * @param {number} startYear - Year to start simulation
 * @param {number} startMonth - Month to start (default 1)
 * @returns {object} Scenario results
 */
function runInvestScenario(balance, annualRate, years, startYear, startMonth = 1) {
    const numMonths = years * 12;
    const monthlyPayment = calculateMonthlyPayment(balance, annualRate, years);
    const returns = getMonthlyReturns(startYear, startMonth, numMonths);

    if (!returns) {
        return { error: 'Insufficient historical data for this period' };
    }

    let investment = balance;
    const history = [{ month: 0, value: investment }];
    let failed = false;
    let failureMonth = null;

    for (let month = 1; month <= numMonths; month++) {
        // Apply market return
        investment *= (1 + returns[month - 1]);

        // Withdraw for mortgage payment
        investment -= monthlyPayment;

        // Check for failure
        if (investment <= 0 && !failed) {
            failed = true;
            failureMonth = month;
            investment = 0;
        }

        history.push({ month, value: Math.max(0, investment) });
    }

    return {
        finalValue: Math.max(0, investment),
        failed,
        failureMonth,
        history,
        monthlyPayment
    };
}

/**
 * Scenario B: Pay off mortgage, invest monthly payments into S&P 500
 * @param {number} balance - Mortgage balance (used to pay off)
 * @param {number} annualRate - Mortgage interest rate (for calculating payment amount)
 * @param {number} years - Original mortgage term
 * @param {number} startYear - Year to start simulation
 * @param {number} startMonth - Month to start (default 1)
 * @returns {object} Scenario results
 */
function runPayoffScenario(balance, annualRate, years, startYear, startMonth = 1) {
    const numMonths = years * 12;
    const monthlyContribution = calculateMonthlyPayment(balance, annualRate, years);
    const returns = getMonthlyReturns(startYear, startMonth, numMonths);

    if (!returns) {
        return { error: 'Insufficient historical data for this period' };
    }

    let investment = 0; // Start with nothing invested
    const history = [{ month: 0, value: investment }];

    for (let month = 1; month <= numMonths; month++) {
        // Add monthly contribution (what would have been mortgage payment)
        investment += monthlyContribution;

        // Apply market return
        investment *= (1 + returns[month - 1]);

        history.push({ month, value: investment });
    }

    return {
        finalValue: investment,
        failed: false,
        failureMonth: null,
        history,
        monthlyContribution
    };
}

// ============================================================================
// MODEL 2: SEPARATE INCOME (Lump Sum vs DCA)
// ============================================================================

/**
 * Model 2 Invest: Lump sum grows untouched (no withdrawals)
 */
function runInvestScenarioModel2(balance, annualRate, years, startYear, startMonth = 1) {
    const numMonths = years * 12;
    const returns = getMonthlyReturns(startYear, startMonth, numMonths);

    if (!returns) {
        return { error: 'Insufficient historical data for this period' };
    }

    let investment = balance;
    const history = [{ month: 0, value: investment }];

    for (let month = 1; month <= numMonths; month++) {
        // Apply market return (no withdrawals in Model 2)
        investment *= (1 + returns[month - 1]);
        history.push({ month, value: investment });
    }

    return {
        finalValue: investment,
        failed: false,
        failureMonth: null,
        history,
        monthlyPayment: calculateMonthlyPayment(balance, annualRate, years)
    };
}

/**
 * Model 2 Payoff: Same as Model 1 - DCA monthly contributions
 * (Reuses runPayoffScenario since it's identical)
 */

/**
 * Compare both scenarios for a single start year
 * @param {number} balance - Mortgage balance
 * @param {number} annualRate - Mortgage interest rate
 * @param {number} years - Mortgage term
 * @param {number} startYear - Year to start
 * @param {string} model - 'drawdown' or 'separate'
 * @returns {object} Comparison results
 */
function compareScenarios(balance, annualRate, years, startYear, model = 'drawdown') {
    let invest, payoff;

    if (model === 'separate') {
        invest = runInvestScenarioModel2(balance, annualRate, years, startYear);
        payoff = runPayoffScenario(balance, annualRate, years, startYear);
    } else {
        invest = runInvestScenario(balance, annualRate, years, startYear);
        payoff = runPayoffScenario(balance, annualRate, years, startYear);
    }

    if (invest.error || payoff.error) {
        return { error: invest.error || payoff.error };
    }

    let winner;
    if (invest.failed) {
        winner = 'payoff';
    } else if (invest.finalValue > payoff.finalValue) {
        winner = 'invest';
    } else {
        winner = 'payoff';
    }

    return {
        invest,
        payoff,
        winner,
        difference: invest.finalValue - payoff.finalValue
    };
}

/**
 * Run historical analysis across all applicable start years
 * @param {number} balance - Mortgage balance
 * @param {number} annualRate - Mortgage interest rate
 * @param {number} years - Mortgage term
 * @param {string} model - 'drawdown' or 'separate'
 * @returns {object} Historical analysis results
 */
function runHistoricalAnalysis(balance, annualRate, years, model = 'drawdown') {
    const results = [];

    // Get the range of available years
    const keys = Object.keys(SP500_MONTHLY_RETURNS).sort();
    const firstYear = parseInt(keys[0].split('-')[0]);
    const lastKey = keys[keys.length - 1];
    const lastYear = parseInt(lastKey.split('-')[0]);
    const lastMonth = parseInt(lastKey.split('-')[1]);

    // Calculate the latest start year that has enough data
    // Need years*12 months of data starting from January
    const latestStartYear = lastYear - years;

    let investWins = 0;
    let payoffWins = 0;
    let failures = 0;

    for (let year = firstYear; year <= latestStartYear; year++) {
        const result = compareScenarios(balance, annualRate, years, year, model);

        if (result.error) continue;

        results.push({
            startYear: year,
            investFinal: result.invest.finalValue,
            payoffFinal: result.payoff.finalValue,
            winner: result.winner,
            difference: result.difference,
            investFailed: result.invest.failed,
            failureMonth: result.invest.failureMonth
        });

        if (result.invest.failed) {
            failures++;
            payoffWins++; // Failure counts as payoff win
        } else if (result.winner === 'invest') {
            investWins++;
        } else {
            payoffWins++;
        }
    }

    const totalYears = results.length;

    return {
        results,
        summary: {
            totalYears,
            investWins,
            payoffWins,
            failures,
            investWinRate: totalYears > 0 ? (investWins / totalYears * 100).toFixed(1) : 0
        }
    };
}

// ============================================================================
// UI FUNCTIONS
// ============================================================================

let comparisonChart = null;

/**
 * Initialize the application
 */
function init() {
    loadFromUrlParams();
    populateYearDropdown();
    applyYearFromUrl();
    setupTabs();
    setupCalculateButton();
    setupExportButton();

    // Run initial calculation
    calculate();
}

/**
 * Load input values from URL parameters
 */
function loadFromUrlParams() {
    const params = new URLSearchParams(window.location.search);

    if (params.has('balance')) {
        document.getElementById('balance').value = params.get('balance');
    }
    if (params.has('rate')) {
        document.getElementById('rate').value = params.get('rate');
    }
    if (params.has('term')) {
        document.getElementById('term').value = params.get('term');
    }
    if (params.has('model')) {
        document.getElementById('model').value = params.get('model');
        updateModelDescription();
    }
}

/**
 * Apply year from URL after dropdown is populated
 */
function applyYearFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('year')) {
        const yearSelect = document.getElementById('startYear');
        const year = params.get('year');
        if (yearSelect.querySelector(`option[value="${year}"]`)) {
            yearSelect.value = year;
        }
    }
}

/**
 * Update URL with current parameters (without page reload)
 */
function updateUrlParams() {
    const balance = document.getElementById('balance').value;
    const rate = document.getElementById('rate').value;
    const term = document.getElementById('term').value;
    const year = document.getElementById('startYear').value;
    const model = document.getElementById('model').value;

    const params = new URLSearchParams();
    params.set('balance', balance);
    params.set('rate', rate);
    params.set('term', term);
    params.set('year', year);
    params.set('model', model);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    history.replaceState(null, '', newUrl);
}

/**
 * Populate the start year dropdown with available years
 */
function populateYearDropdown() {
    const select = document.getElementById('startYear');
    const termInput = document.getElementById('term');
    const years = parseInt(termInput.value) || 30;

    // Get available years
    const keys = Object.keys(SP500_MONTHLY_RETURNS).sort();
    const firstYear = parseInt(keys[0].split('-')[0]);
    const lastKey = keys[keys.length - 1];
    const lastYear = parseInt(lastKey.split('-')[0]);
    const latestStartYear = lastYear - years;

    select.innerHTML = '';

    for (let year = latestStartYear; year >= firstYear; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === 1990) option.selected = true;
        select.appendChild(option);
    }

    // If 1990 not available, select first option
    if (!select.value) {
        select.selectedIndex = 0;
    }
}

/**
 * Setup tab switching
 */
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    const panels = document.querySelectorAll('.tab-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.dataset.tab;

            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(targetId).classList.add('active');
        });
    });
}

/**
 * Setup calculate button
 */
function setupCalculateButton() {
    document.getElementById('calculate').addEventListener('click', calculate);

    // Also recalculate when term changes (affects available years)
    document.getElementById('term').addEventListener('change', () => {
        populateYearDropdown();
    });

    // Update model description when model changes
    document.getElementById('model').addEventListener('change', updateModelDescription);
}

/**
 * Setup export button
 */
function setupExportButton() {
    document.getElementById('export-csv').addEventListener('click', exportResultsToCSV);
}

// Store latest comparison for export
let lastComparison = null;
let lastStartYear = null;
let lastYears = null;

/**
 * Export comparison results to CSV
 */
function exportResultsToCSV() {
    if (!lastComparison) {
        alert('No results to export. Click Calculate first.');
        return;
    }

    const balance = document.getElementById('balance').value;
    const rate = document.getElementById('rate').value;
    const term = document.getElementById('term').value;
    const model = document.getElementById('model').value;

    let csv = 'Mortgage Payoff Calculator Results\n';
    csv += `Balance,$${balance}\n`;
    csv += `Rate,${rate}%\n`;
    csv += `Term,${term} years\n`;
    csv += `Start Year,${lastStartYear}\n`;
    csv += `Model,${model}\n`;
    csv += '\n';
    csv += 'Year,Invest Value,Payoff Value,Difference\n';

    for (let year = 0; year <= lastYears; year++) {
        const monthIndex = year * 12;
        const investVal = lastComparison.invest.history[monthIndex]?.value || 0;
        const payoffVal = lastComparison.payoff.history[monthIndex]?.value || 0;
        const diff = investVal - payoffVal;

        csv += `${lastStartYear + year},${Math.round(investVal)},${Math.round(payoffVal)},${Math.round(diff)}\n`;
    }

    // Add summary
    csv += '\n';
    csv += 'Summary\n';
    if (lastComparison.invest.failed) {
        csv += `Winner,Payoff (Invest failed at month ${lastComparison.invest.failureMonth})\n`;
    } else {
        csv += `Winner,${lastComparison.winner}\n`;
        csv += `Difference,$${Math.round(Math.abs(lastComparison.difference))}\n`;
    }

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mortgage-comparison-${lastStartYear}-${model}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Update the model description text
 */
function updateModelDescription() {
    const model = document.getElementById('model').value;
    const descEl = document.getElementById('model-description');

    if (model === 'separate') {
        descEl.innerHTML = '<strong>Separate Income:</strong> Lump sum grows untouched in market. Mortgage paid from regular income. Classic lump sum vs DCA comparison.';
    } else {
        descEl.innerHTML = '<strong>Drawdown:</strong> Mortgage payments come FROM the investment. Risk of foreclosure if investment depletes.';
    }
}

/**
 * Main calculation function
 */
function calculate() {
    const balance = parseFloat(document.getElementById('balance').value);
    const rate = parseFloat(document.getElementById('rate').value) / 100;
    const years = parseInt(document.getElementById('term').value);
    const startYear = parseInt(document.getElementById('startYear').value);
    const model = document.getElementById('model').value;

    // Update URL with current parameters
    updateUrlParams();

    // Run single-year comparison
    const comparison = compareScenarios(balance, rate, years, startYear, model);
    if (!comparison.error) {
        // Store for export
        lastComparison = comparison;
        lastStartYear = startYear;
        lastYears = years;

        displayComparisonResults(comparison, startYear, years);
        renderComparisonChart(comparison, years, startYear);
    }

    // Run historical analysis
    const historical = runHistoricalAnalysis(balance, rate, years, model);
    displayHistoricalResults(historical);
}

/**
 * Display comparison results for a single year
 */
function displayComparisonResults(comparison, startYear, years) {
    const investValueEl = document.getElementById('invest-value');
    const payoffValueEl = document.getElementById('payoff-value');
    const conclusionEl = document.getElementById('conclusion-line');

    // Format currency
    const formatCurrency = (val) => '$' + Math.round(val).toLocaleString();

    // Invest value
    if (comparison.invest.failed) {
        investValueEl.textContent = `FAILED at month ${comparison.invest.failureMonth}`;
    } else {
        investValueEl.textContent = formatCurrency(comparison.invest.finalValue);
    }

    // Payoff value
    payoffValueEl.textContent = formatCurrency(comparison.payoff.finalValue);

    // Conclusion line
    conclusionEl.classList.remove('invest-wins', 'payoff-wins', 'failed');

    if (comparison.invest.failed) {
        conclusionEl.textContent = `Payoff wins — Invest failed (foreclosure risk)`;
        conclusionEl.classList.add('failed');
    } else {
        const diff = Math.abs(comparison.difference);
        const diffStr = formatCurrency(diff);

        if (comparison.winner === 'invest') {
            conclusionEl.textContent = `Invest wins by ${diffStr}`;
            conclusionEl.classList.add('invest-wins');
        } else {
            conclusionEl.textContent = `Payoff wins by ${diffStr}`;
            conclusionEl.classList.add('payoff-wins');
        }
    }
}

/**
 * Render comparison chart
 */
function renderComparisonChart(comparison, years, startYear) {
    const ctx = document.getElementById('comparison-chart').getContext('2d');

    // Destroy existing chart
    if (comparisonChart) {
        comparisonChart.destroy();
    }

    // Prepare data - sample yearly for cleaner chart
    const investData = [];
    const payoffData = [];
    const labels = [];

    for (let year = 0; year <= years; year++) {
        const monthIndex = year * 12;
        const investVal = comparison.invest.history[monthIndex]?.value || 0;
        const payoffVal = comparison.payoff.history[monthIndex]?.value || 0;

        labels.push(startYear + year);
        investData.push(investVal);
        payoffData.push(payoffVal);
    }

    comparisonChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Invest',
                    data: investData,
                    borderColor: '#0077bb',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1,
                    pointRadius: 2
                },
                {
                    label: 'Payoff',
                    data: payoffData,
                    borderColor: '#ee7733',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1,
                    pointRadius: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // Using custom legend
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const val = context.raw;
                            const sign = val >= 0 ? '' : '';
                            return context.dataset.label + ': $' +
                                   Math.round(val).toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        callback: (value) => '$' + (value / 1000).toFixed(0) + 'k'
                    }
                }
            }
        }
    });

    // Also render the comparison table
    renderComparisonTable(comparison, years, startYear);
}

/**
 * Render year-by-year comparison table
 */
function renderComparisonTable(comparison, years, startYear) {
    const tbody = document.querySelector('#comparison-table tbody');
    tbody.innerHTML = '';

    const formatCurrency = (val) => '$' + Math.round(val).toLocaleString();

    for (let year = 0; year <= years; year++) {
        const monthIndex = year * 12;
        const investVal = comparison.invest.history[monthIndex]?.value || 0;
        const payoffVal = comparison.payoff.history[monthIndex]?.value || 0;
        const diff = investVal - payoffVal;

        const tr = document.createElement('tr');

        // Highlight winner
        if (diff > 0) {
            tr.className = 'winner-invest';
        } else if (diff < 0) {
            tr.className = 'winner-payoff';
        }

        const diffDisplay = (diff >= 0 ? '+' : '') + formatCurrency(diff);

        tr.innerHTML = `
            <td>${startYear + year}</td>
            <td>${formatCurrency(investVal)}</td>
            <td>${formatCurrency(payoffVal)}</td>
            <td>${diffDisplay}</td>
        `;

        tbody.appendChild(tr);
    }
}

/**
 * Display historical analysis results
 */
function displayHistoricalResults(historical) {
    // Summary
    const summaryEl = document.getElementById('summary-text');
    const s = historical.summary;

    summaryEl.innerHTML = `
        <strong>Invest wins:</strong> ${s.investWins} of ${s.totalYears} years (${s.investWinRate}%)<br>
        <strong>Payoff wins:</strong> ${s.payoffWins} of ${s.totalYears} years (${(100 - s.investWinRate).toFixed(1)}%)<br>
        <strong>Invest failures (foreclosure):</strong> ${s.failures}
    `;

    // Heat map
    renderHeatmap(historical.results);

    // Table
    renderHistoryTable(historical.results);
}

/**
 * Render heat map
 */
function renderHeatmap(results) {
    const container = document.getElementById('heatmap');
    container.innerHTML = '';

    results.forEach(r => {
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';

        if (r.investFailed) {
            cell.classList.add('failed');
            cell.title = `${r.startYear}: Invest FAILED (foreclosure)`;
        } else if (r.winner === 'invest') {
            cell.classList.add('invest');
            cell.title = `${r.startYear}: Invest won by $${Math.round(r.difference).toLocaleString()}`;
        } else {
            cell.classList.add('payoff');
            cell.title = `${r.startYear}: Payoff won by $${Math.round(-r.difference).toLocaleString()}`;
        }

        cell.textContent = String(r.startYear).slice(-2);
        container.appendChild(cell);
    });
}

/**
 * Render history table
 */
function renderHistoryTable(results) {
    const tbody = document.querySelector('#history-table tbody');
    tbody.innerHTML = '';

    const formatCurrency = (val) => '$' + Math.round(val).toLocaleString();

    // Show most recent first
    const reversed = [...results].reverse();

    reversed.forEach(r => {
        const tr = document.createElement('tr');

        let winnerClass = r.winner === 'invest' ? 'winner-invest' : 'winner-payoff';
        if (r.investFailed) winnerClass = 'winner-payoff';

        tr.className = winnerClass;

        const investDisplay = r.investFailed
            ? `<span class="failed">FAILED (month ${r.failureMonth})</span>`
            : formatCurrency(r.investFinal);

        const winnerDisplay = r.investFailed
            ? 'Payoff (Invest failed)'
            : (r.winner === 'invest' ? 'Invest' : 'Payoff');

        const diffDisplay = r.investFailed
            ? '—'
            : (r.difference >= 0 ? '+' : '') + formatCurrency(r.difference);

        tr.innerHTML = `
            <td>${r.startYear}</td>
            <td>${investDisplay}</td>
            <td>${formatCurrency(r.payoffFinal)}</td>
            <td>${winnerDisplay}</td>
            <td>${diffDisplay}</td>
        `;

        tbody.appendChild(tr);
    });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
