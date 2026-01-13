# Mortgage Payoff Calculator

Should you pay off your mortgage or invest the money in the S&P 500? This calculator uses historical market data to answer that question.

## The Question

Given a lump sum equal to your mortgage balance, which strategy produces more wealth at the end of the mortgage term?

## Two Income Models

### Model 1: Drawdown
You have the lump sum and no separate income.

- **Invest**: Put lump sum in S&P 500, withdraw mortgage payment each month
- **Payoff**: Pay off mortgage, invest freed cash flow monthly
- **Risk**: Invest scenario can fail (foreclosure) if investment depletes

### Model 2: Separate Income
You have the lump sum AND regular income for mortgage payments.

- **Invest**: Put lump sum in S&P 500 (grows untouched), pay mortgage from income
- **Payoff**: Pay off mortgage, invest income monthly (dollar-cost averaging)
- **Risk**: Neither scenario can fail

## Features

- **Scenario Comparison**: Detailed year-by-year analysis for a specific start year
- **Historical Analysis**: Sweep all applicable start years (1928-present)
- **Interactive Charts**: Visualize wealth accumulation over time
- **Colorblind-Safe Design**: Blue/orange palette for accessibility

## Historical Results

Using default parameters ($300k balance, 6% rate, 30-year term):

| Model | Invest Wins | Payoff Wins | Failures |
|-------|-------------|-------------|----------|
| Drawdown | ~0% | ~57% | ~43% |
| Separate Income | ~65% | ~35% | 0% |

## Data Source

S&P 500 monthly returns from 1928-02 to 2025-12 (Yahoo Finance, adjusted for dividends and splits).

## Running Tests

```bash
node run_tests.js
```

89 tests covering both models, edge cases, and data integrity.

## Files

- `index.html` - Main application UI
- `app.js` - Calculation logic
- `sp500_data.js` - Historical S&P 500 monthly returns
- `tests.js` - Comprehensive test suite
- `run_tests.js` - Test runner
- `REQUIREMENTS.md` - Detailed requirements document
