## Mortgage Payoff vs Invest Calculator

Compare two scenarios: paying off your mortgage early vs investing that money in the S&P 500.

### Live Demo

**https://marhar.github.io/mortgage-payoff/**

### How It Works

This calculator helps you decide whether to:
- **Pay off your mortgage early**: Use extra money to pay down principal
- **Invest the extra money**: Keep the mortgage and invest in S&P 500

### Features

- Uses actual historical S&P 500 monthly returns (1928-present)
- Calculates mortgage amortization with extra payments
- Shows net worth comparison over time
- Interactive chart showing both scenarios
- Simple, focused interface - no tax complexity

### Scenarios Explained

#### Scenario A: Pay Off Early
1. Apply extra monthly payment to mortgage principal
2. Calculate new payoff date (years saved)
3. After payoff, invest the freed-up mortgage payment
4. Final net worth = investment value (mortgage paid off)

#### Scenario B: Invest Extra
1. Pay mortgage on normal schedule
2. Invest extra payment in S&P 500 each month
3. Use actual historical returns for investment growth
4. Final net worth = investment value - 0 (mortgage paid off at end)

### Example Use Case

**Inputs:**
- Mortgage Balance: $300,000
- Interest Rate: 3.5%
- Remaining Years: 25
- Extra Monthly Payment: $500
- Start Date: 2020-01-01

**Results will show:**
- Which strategy produces higher net worth
- How much interest you save/pay
- Timeline for mortgage payoff
- Net worth growth over time

### Key Considerations

**Not Included (Intentionally Simple):**
- Tax implications (mortgage interest deduction, capital gains)
- PMI elimination benefits
- Different account types (IRA, 401k, taxable)
- Refinancing options

These can be added later - we're keeping it focused on the core question first.

### Technical Details

**Built with:**
- Vanilla JavaScript (no frameworks)
- Chart.js for visualization
- Historical S&P 500 data from Yahoo Finance

**Files:**
- `index.html` - Calculator interface
- `app.js` - Main application logic
- `mortgage.js` - Mortgage amortization calculations
- `sp500_data.js` - Historical S&P 500 monthly returns
- `simple.min.css` - Styling

### Related Tools

- [Stock Returns Calculator](../stockreturns/) - Calculate S&P 500 investment returns

### Important Disclaimer

This calculator uses historical data for illustration purposes. Past performance does not guarantee future results. Paying off your mortgage provides a guaranteed return equal to your interest rate, while investing carries market risk. Consider your personal financial situation, risk tolerance, and consult with a financial advisor before making decisions.

### Data Source

S&P 500 Index (^GSPC) data from Yahoo Finance via yfinance library.
