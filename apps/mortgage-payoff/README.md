# Mortgage Payoff vs Invest Calculator

**The Question:** You have enough cash to pay off your mortgage. Should you pay it off, or invest the money in the S&P 500?

**Live Demo: https://marhar.github.io/mortgage-payoff/**

---

## Overview

This web-based calculator compares two scenarios using actual historical S&P 500 returns:

**Scenario A: Pay Off Mortgage**
- Use your cash to eliminate the mortgage debt completely
- Invest the freed-up monthly payment in S&P 500
- Guaranteed return = your mortgage interest rate (interest avoided)

**Scenario B: Invest the Cash**
- Keep your mortgage and continue normal payments
- Invest the lump sum in S&P 500 immediately
- Variable return = historical S&P 500 performance

The calculator shows which strategy produces higher net worth over your mortgage's remaining term.

---

## How to Use

1. **Open**: https://marhar.github.io/mortgage-payoff/
2. **Enter your mortgage details**:
   - Current Balance: e.g., $300,000
   - Interest Rate: e.g., 3.5%
   - Remaining Years: e.g., 25
3. **Choose timeframe**:
   - Start Date: e.g., 2020-01-01
4. **Click "Compare Scenarios"**

### What You'll See

**Results Cards:**
- **Scenario A**: Interest saved, investment from freed payments, final net worth
- **Scenario B**: Investment growth, interest paid on mortgage, final net worth
- **Winner**: Which strategy wins and by how much

**Chart:**
- Visual comparison of net worth over time for both scenarios
- Blue line = Pay off mortgage path
- Green line = Invest cash path

---

## When Each Strategy Wins

### Paying Off Wins When:
- **High interest rate** (6%+ mortgage)
- **Poor market periods** (2000-2010 "lost decade")
- **Short timeline** with high rates
- **Risk averse** (guaranteed return vs market volatility)

**Example:** Change rate to 7% - paying off likely wins because the guaranteed 7% return beats many market periods.

### Investing Wins When:
- **Low interest rate** (3-4% mortgage)
- **Strong market periods** (2010-2020 bull market)
- **Long timeline** (markets tend to outperform over decades)
- **Risk tolerant** (accept volatility for higher potential returns)

**Example:** 3.5% mortgage from 2020-2024 - investing likely wins due to strong market performance.

---

## Features

- Simple 4-input interface (no lump sum entry needed - uses mortgage balance)
- Uses actual historical S&P 500 returns (1928-present)
- Net worth comparison chart
- Automatic calculation of freed monthly payment
- No tax complexity (intentionally simplified)
- Works entirely in browser (no installation)

---

## Key Assumptions

### What's Included:
- Actual historical S&P 500 monthly returns
- Mortgage amortization calculations
- Dollar-cost averaging for freed payments (Scenario A)
- Lump sum growth (Scenario B)

### What's NOT Included (Intentionally):
- Tax implications (mortgage interest deduction, capital gains)
- PMI elimination
- Different investment accounts (IRA vs taxable)
- Inflation adjustments
- Other investments besides S&P 500

**Why simplified?** Focus on the core question first. Tax situation varies greatly by person and changes over time.

---

## Technical Details

**Built with:**
- Vanilla JavaScript (no frameworks required)
- Chart.js for visualization
- Pre-downloaded S&P 500 historical data (1928-present)

**Files:**
- `index.html` - Calculator interface
- `app.js` - Scenario comparison logic
- `mortgage.js` - Mortgage amortization library
- `sp500_data.js` - Historical S&P 500 monthly returns (40KB)
- `simple.min.css` - Styling

**Data Source:** S&P 500 Index (^GSPC) from Yahoo Finance

---

## Important Disclaimer

This calculator uses historical data for illustration purposes only. **Past performance does not guarantee future results.**

**Key considerations:**
- Paying off your mortgage provides a **guaranteed return** equal to your interest rate
- Investing in S&P 500 provides **variable returns** with market risk
- Your decision should consider your personal financial situation, risk tolerance, emergency fund, and overall financial goals
- **Consult with a financial advisor** before making major financial decisions

---

## Related Tools

- **[Stock Returns Calculator](../stockreturns/)** - Calculate S&P 500 investment returns with dollar-cost averaging
