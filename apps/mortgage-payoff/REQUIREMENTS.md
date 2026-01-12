# Mortgage Payoff Calculator v2 - Requirements

## Core Question

Given a lump sum equal to my mortgage balance, should I pay off the mortgage or invest in the S&P 500?

## The Two Scenarios

### Scenario A: Invest the Lump Sum

- Invest the entire lump sum in S&P 500
- Each month, withdraw the mortgage payment amount from the investment
- Investment grows (or shrinks) based on market returns minus withdrawals
- At end of mortgage term (if successful): remaining investment + house is paid off
- **Risk**: If investment hits zero, cannot make payment → foreclosure

### Scenario B: Pay Off the Mortgage

- Use lump sum to pay off mortgage immediately
- House is owned free and clear - no monthly payment required
- Each month, invest what would have been the mortgage payment into S&P 500
- At end of original mortgage term: investment has grown from monthly contributions
- **Risk**: None for property. Investment may lose value but you still own the house.

## Key Constraint: No Double-Counting

In both scenarios, the same monthly cash flow is available. The difference is:
- **Scenario A**: Monthly payment goes to mortgage; lump sum grows in market
- **Scenario B**: Monthly payment goes to investment; no mortgage

This ensures a fair comparison. We are not assuming we can invest the full sum AND have separate money for payments.

## Inputs

- Mortgage balance (the lump sum amount)
- Mortgage interest rate
- Remaining term (years)
- Expected S&P 500 return (or historical data)

## Risk Model

### Scenario A Risk: Foreclosure

In Scenario A (Invest), mortgage payments are withdrawn from the investment each month. If the investment value reaches zero before the mortgage is paid off:

- **Outcome**: Cannot make mortgage payment → foreclosure → lose the property
- **Mitigation**: Must find another source of monthly income to continue payments

This is the key risk of Scenario A. A market crash early in the term can deplete the investment before it recovers.

### Scenario B Risk: None (for property)

In Scenario B (Payoff), the property is owned free and clear immediately. There is no foreclosure risk. The investment may go to zero, but you still own your home.

### Risk Asymmetry

This creates an asymmetric comparison:
- Scenario A may yield higher returns, but carries foreclosure risk
- Scenario B has guaranteed housing security, but potentially lower returns

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
