# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a command-line tool that calculates future value of S&P 500 investments using actual historical monthly returns data. It demonstrates dollar-cost averaging by simulating regular monthly investments over a specified time period and compares actual historical performance against a constant annual rate.

## Running the Program

```bash
# Basic usage
./stockreturns.py -i 10000 -m 500 -s 2020-01-01 -e 2024-12-31

# With custom comparison rate
./stockreturns.py -i 1000 -m 100 -s 1968-01-01 -e 1986-01-01 -r 0.08

# Installation
pip install -r requirements.txt
```

## Architecture

### Data Pipeline

1. **download_sp500_data()**: Downloads daily S&P 500 data from Yahoo Finance (^GSPC ticker) and resamples to monthly intervals using `resample('ME').last()`. Daily data is used instead of monthly because Yahoo Finance has better historical coverage for daily data going back to the 1920s.

2. **calculate_monthly_returns()**: Converts price data to monthly returns using percentage change. Handles multi-ticker column structures from yfinance by checking for 'Close' column variants.

3. **calculate_future_value_actual()**: Simulates the investment strategy:
   - Starts with initial investment
   - Adds monthly investment at the beginning of each month
   - Applies actual historical monthly returns
   - Builds cash flow array for IRR calculation
   - Tracks year-end balances for annual breakdown table

4. **calculate_future_value_annual_rate()**: Computes equivalent result using constant annual rate for comparison.

### Key Calculation: IRR vs CAGR

The program uses **Internal Rate of Return (IRR)** from numpy-financial, not simple CAGR. This is critical:

- **Cash flow structure**: `[-initial, -monthly, -monthly, ..., +final_value]`
- **Monthly IRR** computed by `npf.irr(cash_flows)`
- **Annualized IRR**: `((1 + monthly_irr) ** 12 - 1) * 100`

IRR accounts for the timing of each monthly investment (dollar-cost averaging), giving an accurate annualized return. A simple CAGR would incorrectly assume all money was invested on day one.

### Output Format

The program outputs four sections:
1. Actual S&P 500 returns with IRR
2. Constant annual rate comparison
3. Comparison delta
4. **Annual Breakdown Table**: Shows year-by-year portfolio growth

**Important**: The "Portfolio Growth" column includes BOTH market returns AND new contributions. It's not pure market performance - it's the percentage change in portfolio value, which can be misleading (e.g., 124% "growth" when you doubled your money by contributing). This is intentional and documented with a note in the output.

## Data Handling Specifics

- Uses `yfinance` with `auto_adjust=True` so adjusted close prices already account for dividends and splits
- Resamples daily to monthly using pandas `resample('ME')` (month-end, not deprecated 'M')
- Handles missing data by using `.dropna()` on monthly returns
- Assumes monthly investments occur at the beginning of each month

## Testing Examples

The codebase includes these test scenarios in the approved tool list:
- `./stockreturns.py -i 1000 -m 100 -s 1968-01-01 -e 1986-01-01` (challenging 18-year period with 1970s stagflation)
- `./stockreturns.py -i 10000 -m 500 -s 2020-01-01 -e 2024-12-31` (recent 5-year period)
- `./stockreturns.py -i 5000 -m 200 -s 1950-01-01 -e 1970-01-01` (post-war boom period)

These cover different market conditions and validate the historical data pipeline works correctly.
