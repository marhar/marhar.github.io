# Buy House Calculator - Calculation Documentation

## Critical Financial Accuracy Requirements

This is a financial calculator that people may use to make major life decisions. **All calculations must be 100% accurate, verifiable, and explainable.**

## Data Source

**S&P 500 Historical Monthly Returns**
- Source: Yahoo Finance (^GSPC ticker)
- Downloaded via yfinance Python library
- Date range: February 1928 to October 2025
- Total: 1,173 months of data
- All returns are adjusted for dividends and splits

### Important Data Caveat

When requesting data starting from year YYYY, the Python `yfinance` library:
1. Downloads daily prices starting from `YYYY-01-01`
2. Resamples to monthly (end of month prices)
3. Calculates returns using `pct_change()` which **drops the first month**
4. Therefore, data for year 1990 actually starts in **February 1990**

**This behavior is replicated exactly in our JavaScript implementation.**

## Formulas

### 1. Monthly Mortgage Payment

```
P = B * (r * (1 + r)^n) / ((1 + r)^n - 1)
```

Where:
- `P` = Monthly payment
- `B` = Loan balance (home price)
- `r` = Monthly interest rate (annual rate / 12)
- `n` = Total number of payments (years * 12)

**Example:** $500,000 loan, 7% annual rate, 30 years
```
B = 500,000
r = 0.07 / 12 = 0.005833333
n = 30 * 12 = 360

(1 + r)^n = 8.116497475
P = 500,000 * (0.005833333 * 8.116497475) / (8.116497475 - 1)
P = $3,326.51
```

### 2. Total Interest Paid

```
Total Interest = (P * n) - B
```

**Example:**
```
Total Interest = ($3,326.51 * 360) - $500,000
               = $1,197,544.49 - $500,000
               = $697,544.49
```

### 3. Scenario 1: Pay Cash, Invest Monthly

**Logic:**
- Pay cash for home ($B)
- Each month, invest the amount you would have paid as a mortgage payment ($P)
- Each monthly investment grows with actual S&P 500 returns from that point forward

**Formula for investment value:**
```
Investment Value = Σ(i=0 to n-1) [ P * Π(j=i to n-1)(1 + r_j) ]
```

Where `r_j` is the actual S&P 500 return for month j.

**Total Value:**
```
Total Value = B + Investment Value
```

### 4. Scenario 2: Get Mortgage, Invest Lump Sum

**Logic:**
- Get mortgage for $B
- Invest the full $B upfront into S&P 500
- Pay mortgage payments each month
- Lump sum grows with actual S&P 500 returns

**Formula for investment value:**
```
Investment Value = B * Π(j=0 to n-1)(1 + r_j)
```

**Total Value:**
```
Total Value = B + Investment Value - Total Interest
```

## Verification Tests

### Test Case: $500k, 7%, 30 years, starting 1990

**Expected Results (from Python original):**
```
Monthly Payment:    $3,326.51
Total Interest:     $697,544.49
Avg Annual Return:  7.91%

Scenario 1:
  Investment Growth:  $4,229,054.79
  Total Value:        $4,729,054.79

Scenario 2:
  Investment Growth:  $4,900,814.62
  Total Value:        $4,703,270.13

Difference: $25,784.66 (Scenario 1 wins)
```

**How to verify:**
```bash
# Using Python original
python3 buyhouse.py 1990 -b 500000 -r 0.07 -t 30

# Using verification script
python3 verify_calculations.py
```

## Known Limitations

1. **Data Availability:** Historical data only goes back to 1928. Future projections are not available.

2. **Start Date Precision:** Data starts from February of the requested year (not January) due to how pct_change() works.

3. **No Rebalancing:** Calculations assume buy-and-hold strategy with no rebalancing or withdrawals.

4. **Tax Implications Ignored:** Does not account for:
   - Capital gains taxes on investment growth
   - Mortgage interest deductions
   - State/local tax differences

5. **Transaction Costs Ignored:** No fees, commissions, or expense ratios included.

6. **Home Value Assumptions:** Assumes home maintains its value at $B. Does not account for:
   - Home appreciation/depreciation
   - Maintenance costs
   - Property taxes
   - Insurance

## Sequence of Return Risk

**Critical concept:** The timing of market returns dramatically affects outcomes.

The same average return can produce vastly different results depending on when returns occur:
- **Early losses + late gains:** Better for monthly investment (dollar cost averaging)
- **Early gains + late losses:** Better for lump sum investment

This is why the "winner" changes based on the starting year despite similar long-term averages.

## Calculation Audit Trail

Every calculation can be manually verified:

1. **Monthly Payment:** Use standard amortization formula
2. **Market Returns:** Check against Yahoo Finance ^GSPC historical data
3. **Investment Growth:** Replay month-by-month compounding
4. **Final Values:** Sum components (home + investments - interest)

## Code Verification

To ensure JavaScript matches Python:

```bash
# Run verification suite
python3 verify_calculations.py

# Test specific scenario
python3 buyhouse.py [year] -b [balance] -r [rate] -t [term]
```

All results should match to the penny.

## Questions or Concerns

If you find any discrepancies or have questions about the calculations:
1. Check this documentation first
2. Run `verify_calculations.py` to confirm
3. Compare with Python original using `buyhouse.py`
4. File an issue if numbers don't match

**Remember: This calculator is for educational purposes. Consult a financial advisor for actual investment decisions.**
