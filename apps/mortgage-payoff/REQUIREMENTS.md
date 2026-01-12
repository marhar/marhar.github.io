# Mortgage Payoff Calculator v2 - Requirements

## Core Question

Given a lump sum equal to my mortgage balance, should I pay off the mortgage or invest in the S&P 500?

## Income Models

The calculator supports two different income models. The user can select which model to use.

### Model 1: Drawdown

You have the lump sum and nothing else. No separate income source.

**Invest scenario:**
- Put lump sum in S&P 500
- Withdraw mortgage payment from investment each month
- Investment grows (or shrinks) based on market returns minus withdrawals
- **Risk**: If investment hits zero → cannot pay mortgage → foreclosure

**Payoff scenario:**
- Use lump sum to pay off mortgage immediately
- House is owned free and clear
- Invest what would have been the mortgage payment each month (freed cash flow)
- **Risk**: None for property

**Characteristics:**
- Invest faces sequence-of-returns risk (bad early returns are devastating)
- Historical result: Payoff wins ~100% of scenarios, Invest fails ~43%

### Model 2: Separate Income

You have the lump sum AND regular income equal to the mortgage payment.

**Invest scenario:**
- Put lump sum in S&P 500 (grows untouched)
- Pay mortgage from regular income
- At end of term: investment has compounded for full period

**Payoff scenario:**
- Use lump sum to pay off mortgage immediately
- Invest regular income each month (dollar-cost averaging)
- At end of term: investment has grown from monthly contributions

**Characteristics:**
- Neither scenario can go bankrupt
- Classic "lump sum vs DCA" comparison
- Lump sum typically wins ~2/3 of the time historically

## Key Constraint: No Double-Counting

In both models, the same total money is in play. We never assume you can invest the full lump sum AND have separate money for payments without accounting for it.

## Inputs

- Mortgage balance (the lump sum amount)
- Mortgage interest rate
- Remaining term (years)
- Expected S&P 500 return (or historical data)

## Risk Model

Risk depends on which income model is selected:

### Model 1 (Drawdown) Risks

- **Invest**: Foreclosure risk if investment depletes before mortgage is paid off
- **Payoff**: No property risk (house owned outright)
- Creates asymmetric comparison

### Model 2 (Separate Income) Risks

- **Invest**: No foreclosure risk (mortgage paid from income)
- **Payoff**: No property risk (house owned outright)
- Symmetric comparison - purely about returns

## Views

### View A: Scenario Comparison

Single-year detailed analysis answering: "Better to pay off or invest?"

**Inputs:**
- Mortgage balance, rate, term
- Start year for historical data

**Outputs:**
- Final values for both scenarios
- Winner declaration
- Growth chart over time showing both scenarios

### View B: Historical Comparison

Sweep all applicable start years to show historical patterns.

**Outputs:**
- Simple winner for each start year (Invest or Payoff)
- Final values for each scenario
- Table of results by year
- Heat map visualization

## Navigation

Tab-based navigation between views.

## Default Values

- Mortgage balance: $300,000
- Interest rate: 6%
- Term: 30 years
- Start year: 1990

## Tax Implications

Ignored for v2. May add in future version.

## Accessibility

**Critical requirement**: All UI must be legible by color blind people.

- Choose colorblind-safe palettes (avoid red/green distinctions)
- Use sufficient contrast
- Consider using patterns or shapes in addition to color
- Recommended palettes: blue/orange, blue/yellow, or use varying saturation/brightness

## S&P 500 Return Modeling

Use historical S&P 500 data (not Monte Carlo or fixed assumptions).

### Single-Year Analysis

- User specifies a start year
- Simulation runs using actual historical returns from that year forward
- Shows detailed month-by-month or year-by-year progression
- Compares final values of both scenarios

### Historical Sweep Analysis

- Button to run simulation across all applicable start years
- "Applicable" = years where we have enough data for the full mortgage term
- Reports:
  - **Percentage success rate**: What % of start years did Invest beat Payoff?

## S&P 500 Data Source

Use data from `apps/stockreturns/sp500_data.js`:

- Format: `SP500_MONTHLY_RETURNS` object with keys like "1928-02"
- Values: Decimal monthly returns (e.g., -0.0176 = -1.76%)
- Range: 1928-02 to 2025-12
- Source: Yahoo Finance (^GSPC), adjusted for dividends and splits

Copy the file to this app's directory so the app is standalone.

## Open Questions

1. Do we consider the "peace of mind" factor of being debt-free? (qualitative, not modeled)
2. What time horizon matters - end of mortgage term, or longer?
