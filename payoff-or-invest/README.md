# Buy House Calculator

## Overview

Should you pay cash for a home, or get a mortgage and invest the cash? This calculator uses **real historical S&P 500 data** to compare two scenarios and demonstrate **sequence of return risk**.

### Scenario 1: Pay Cash
- Buy home with cash (amount B)
- Invest monthly mortgage-equivalent payments into S&P 500
- Final value = Home + Investment growth

### Scenario 2: Get Mortgage
- Get mortgage, invest full home price as lump sum
- Pay monthly mortgage payments
- Final value = Home + Investment growth - Total interest paid

### Key Insight: Sequence of Return Risk

The **timing** of market returns dramatically affects which strategy wins, even with identical average returns. This calculator uses real historical data to show how outcomes vary based on when you start.

## Accuracy & Verification

✅ **Calculations verified** against original Python implementation
✅ **Real historical data** from Yahoo Finance S&P 500 (1928-2025)
✅ **Fully documented** formulas with step-by-step explanations
✅ **Test suite included** to verify correctness

See [ACCURACY_REPORT.md](ACCURACY_REPORT.md) for detailed verification results.

## Usage

### Web Version (Recommended)

```bash
# Start web server
python3 -m http.server 8000

# Open browser to http://localhost:8000
```

Interactive web interface with:
- Real-time calculations
- Interactive charts
- Month-by-month progress visualization
- Mobile-friendly responsive design

### Python Command Line

```bash
python3 buyhouse.py [start_year] [-b BALANCE] [-r RATE] [-t TERM] [-m] [--risk]
```

**Arguments:**
- `start_year` - Starting year for historical data (default: 1990)
- `-b, --balance` - Home price / mortgage balance (default: $500,000)
- `-r, --rate` - Annual mortgage interest rate (default: 0.07 for 7%)
- `-t, --term` - Mortgage term in years (default: 30)
- `-m, --monthly` - Show month-by-month progress for both scenarios
- `--risk` - Analyze all possible starting dates to show sequence of return risk

**Examples:**

Basic usage with defaults:
```bash
python3 buyhouse.py
```

Different starting years:
```bash
python3 buyhouse.py 1980    # Strong bull market period
python3 buyhouse.py 1990    # Mixed period with strong growth
python3 buyhouse.py 1995    # Includes dot-com boom and bust, 2008 crisis
```

Custom parameters:
```bash
python3 buyhouse.py 1995 -b 750000 -r 0.06 -t 15
python3 buyhouse.py 2000 --balance 1000000 --rate 0.055 --term 20
```

Show month-by-month progress:
```bash
python3 buyhouse.py 1995 -t 10 --monthly
```

Analyze sequence of return risk across all historical periods:
```bash
python3 buyhouse.py -t 15 --risk
python3 buyhouse.py -t 10 -b 300000 -r 0.06 --risk
```

The results will vary significantly based on the starting year, demonstrating **sequence of return risk** -
the risk that the timing of market returns can dramatically affect your final outcome.

The `--monthly` flag shows how each scenario evolves over time, revealing when one strategy overtakes 
the other. For terms over 15 years, it displays annual snapshots to keep output manageable.

The `--risk` flag runs the analysis across all possible starting dates in the historical record, showing:
- Win/loss statistics for each strategy
- Best and worst case scenarios
- Distribution histogram of outcomes
- Year-by-year results table

This provides a comprehensive view of how much luck and timing matter in the pay cash vs. invest decision.

## Verification & Testing

To verify calculations are correct:

```bash
# Run comprehensive verification suite
python3 verify_calculations.py

# Download fresh S&P 500 data
python3 download_sp500.py

# Compare web version with Python original
python3 buyhouse.py 1990 -b 500000 -r 0.07 -t 30
# Then check same parameters in web version - results should match exactly
```

## Documentation

- **[CALCULATIONS.md](CALCULATIONS.md)** - Detailed formula documentation with examples
- **[ACCURACY_REPORT.md](ACCURACY_REPORT.md)** - Verification test results and accuracy audit
- **[README.md](README.md)** - This file

## Files

**Web Application:**
- `index.html` - Web interface
- `app.js` - JavaScript calculation engine
- `sp500_data.js` - Historical S&P 500 data (1928-2025)

**Python Tools:**
- `buyhouse.py` - Original Python implementation (ground truth)
- `download_sp500.py` - Downloads fresh S&P 500 data
- `verify_calculations.py` - Verification test suite
- `sp500_monthly_returns.json` - Historical data in JSON format

**Documentation:**
- `CALCULATIONS.md` - Formula documentation
- `ACCURACY_REPORT.md` - Verification report
- `README.md` - This file

## Important Notes

⚠️ **Data Start Month:** Historical data starts from **February** of the selected year (not January) due to how percentage change calculations work. This matches the Python original exactly.

⚠️ **What's NOT Included:** This calculator does not account for:
- Capital gains taxes
- Mortgage interest tax deductions
- Home appreciation/depreciation
- Maintenance costs
- Property taxes
- Transaction fees
- Inflation adjustments

⚠️ **Educational Purpose:** This tool is for educational purposes only. Consult a qualified financial advisor for actual investment decisions.

## License

For educational and personal use.
