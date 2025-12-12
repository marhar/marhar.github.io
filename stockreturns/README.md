# Stock Returns Calculator

Calculate the future value of investments in the S&P 500 using actual historical monthly returns data.

## Features

- Downloads actual S&P 500 historical data from Yahoo Finance
- Calculates future value based on:
  - Initial investment amount
  - Monthly recurring investments
  - Actual historical monthly returns
- Compares results with a representative constant annual rate
- Shows total invested, final value, returns, and IRR (Internal Rate of Return)
- IRR properly accounts for the timing of monthly investments (dollar-cost averaging)

## Installation

1. Install required dependencies:

```bash
pip install -r requirements.txt
```

Or install manually:

```bash
pip install yfinance pandas numpy-financial
```

## Usage

```bash
python stockreturns.py --initial <amount> --monthly <amount> --start <date> --end <date> [--annual-rate <rate>]
```

### Required Arguments

- `-i, --initial`: Initial investment amount in dollars
- `-m, --monthly`: Monthly investment amount in dollars
- `-s, --start`: Investment start date (format: YYYY-MM-DD)
- `-e, --end`: Investment end date (format: YYYY-MM-DD)

### Optional Arguments

- `-r, --annual-rate`: Representative annual return rate for comparison (default: 0.10 = 10%)

### Examples

1. **Basic example**: Invest $10,000 initially with $500/month from 2020 to 2024

```bash
python stockreturns.py --initial 10000 --monthly 500 --start 2020-01-01 --end 2024-12-31
```

2. **With custom comparison rate**: Compare against 12% annual return

```bash
python stockreturns.py -i 5000 -m 1000 -s 2015-06-01 -e 2025-01-01 --annual-rate 0.12
```

3. **Long-term investment**: 10 year investment period

```bash
python stockreturns.py -i 25000 -m 750 -s 2014-01-01 -e 2024-01-01
```

## Web Version

A web-based version of this calculator is available at:

**https://marhar.github.io/stockreturns/**

The web version provides:
- Interactive form for entering investment parameters
- Real-time calculations using pre-downloaded historical S&P 500 data
- Visual chart comparing actual returns vs. constant rate
- Annual breakdown table showing year-by-year portfolio growth
- Works entirely in the browser (no server required)

### Updating Web Data

To update the historical S&P 500 data for the web version:

```bash
cd stockreturns
python3 download_sp500.py
```

This downloads the latest data from Yahoo Finance and generates:
- `sp500_monthly_returns.json` - JSON format data
- `sp500_data.js` - JavaScript module for the web app

After updating, commit and push the changes to update the live site.

## CLI Output

The program displays four sections:

1. **Actual S&P 500 Historical Returns**: Shows the final value using real monthly returns
2. **Constant Annual Rate Comparison**: Shows the final value using a constant annual rate
3. **Comparison**: Shows the difference between the two approaches
4. **Annual Breakdown**: Year-by-year table showing end value, total invested, and portfolio growth % (which includes both market returns AND new contributions)

Example output:

```
======================================================================
ACTUAL S&P 500 HISTORICAL RETURNS
======================================================================
Initial Investment:    $10,000.00
Monthly Investment:    $500.00
Investment Period:     2020-01-01 to 2024-12-31
Duration:              5.00 years (60 months)

Total Invested:        $39,500.00
Final Value:           $60,447.63
Total Return:          $20,947.63 (+53.03%)
IRR (Annualized):      13.76%

======================================================================
CONSTANT ANNUAL RATE COMPARISON (10.0% annually)
======================================================================
Initial Investment:    $10,000.00
Monthly Investment:    $500.00
Annual Return Rate:    10.0%
Duration:              5.00 years (60 months)

Total Invested:        $40,000.00
Final Value:           $53,456.78
Total Return:          $13,456.78 (+33.64%)

======================================================================
COMPARISON
======================================================================
Actual vs 10.0% Rate: +$1,777.78 (+3.32%)

Actual historical returns performed BETTER than 10.0% annual rate

======================================================================
ANNUAL BREAKDOWN
======================================================================
Note: Portfolio Growth % includes both market returns AND new contributions
----------------------------------------------------------------------
Year           End Value  Total Invested  Portfolio Growth
----------------------------------------------------------------------
2020     $     18,199.96 $     15,500.00            82.00%
2021     $     29,948.59 $     21,500.00            64.55%
2022     $     29,704.59 $     27,500.00            -0.81%
2023     $     43,663.63 $     33,500.00            46.99%
2024     $     60,707.75 $     39,500.00            39.04%
```

## Data Source

The program uses the S&P 500 Index (^GSPC) data from Yahoo Finance, accessed via the `yfinance` library. Data includes:
- Daily adjusted closing prices (accounts for dividends and splits)
- Resampled to monthly intervals (month-end values)
- Historical data back to the 1920s (Yahoo Finance's full coverage)
- More reliable for historical periods than direct monthly data

## How It Works

1. **Data Download**: Downloads S&P 500 daily price data from Yahoo Finance and resamples to monthly (month-end) values
2. **Return Calculation**: Calculates monthly returns from adjusted close prices
3. **Simulation**: Simulates investment by:
   - Starting with initial investment
   - Adding monthly investment at the beginning of each month
   - Applying actual historical monthly returns
4. **IRR Calculation**: Calculates Internal Rate of Return by:
   - Building cash flow array (negative for investments, positive for final value)
   - Computing monthly IRR using numpy-financial
   - Annualizing to get yearly equivalent rate
5. **Comparison**: Calculates equivalent result using constant annual rate
6. **Analysis**: Shows IRR, total returns, and comparison between methods

## IRR vs Simple Returns

The program uses **Internal Rate of Return (IRR)** instead of a simple CAGR calculation because:

- **IRR accounts for timing**: With dollar-cost averaging, you invest different amounts at different times
- **More accurate**: IRR treats each monthly investment as a separate cash flow with its own timing
- **Industry standard**: IRR is the standard metric for evaluating investments with multiple cash flows
- **Better for comparison**: Accurately compares your actual performance against benchmarks

For example, a $40,000 total investment might show 53% total return but a 13.76% IRR, properly reflecting the annualized return on capital considering when each dollar was invested.

## Notes

- Past performance does not guarantee future results
- The program uses adjusted close prices which account for dividends and stock splits
- Monthly investments are assumed to be made at the beginning of each month
- The comparison rate defaults to 10% annually (approximately the S&P 500's historical average)
- IRR properly accounts for dollar-cost averaging (investing equal amounts at regular intervals)

## Requirements

- Python 3.7+
- yfinance >= 0.2.0
- pandas >= 2.0.0
- numpy-financial >= 1.0.0
