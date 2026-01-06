#!/usr/bin/env python3
"""
Stock Returns Calculator - Calculate future value of investments in S&P 500
using actual historical monthly data.
"""

import argparse
import sys
from datetime import datetime, timedelta
import yfinance as yf
import pandas as pd
import numpy_financial as npf


def download_sp500_data(start_date, end_date):
    """
    Download S&P 500 historical data from Yahoo Finance.
    Downloads daily data and resamples to monthly for better historical coverage.

    Args:
        start_date: Start date for historical data
        end_date: End date for historical data

    Returns:
        DataFrame with S&P 500 monthly data
    """
    print(f"Downloading S&P 500 data from {start_date} to {end_date}...")

    # ^GSPC is the S&P 500 Index ticker on Yahoo Finance
    # Download daily data for better historical coverage (goes back to 1920s)
    sp500_daily = yf.download('^GSPC', start=start_date, end=end_date, interval='1d',
                              progress=False, auto_adjust=True)

    if sp500_daily.empty:
        raise ValueError("No data downloaded. Check your date range and internet connection.")

    # Resample daily data to monthly (use last business day of each month)
    sp500 = sp500_daily.resample('ME').last()

    print(f"Downloaded {len(sp500_daily)} days, resampled to {len(sp500)} months\n")
    return sp500


def calculate_monthly_returns(data):
    """
    Calculate monthly returns from price data.

    Args:
        data: DataFrame with price data

    Returns:
        Series with monthly returns
    """
    # Use close prices (auto_adjust=True means dividends/splits are already adjusted)
    # Handle both single and multi-ticker column structures
    if 'Close' in data.columns:
        prices = data['Close']
    elif ('Close', '^GSPC') in data.columns:
        prices = data[('Close', '^GSPC')]
    else:
        # Fallback: try to get any Close column
        close_cols = [col for col in data.columns if 'Close' in str(col)]
        if close_cols:
            prices = data[close_cols[0]]
        else:
            raise ValueError(f"Could not find Close price column. Available columns: {data.columns.tolist()}")

    # Ensure prices is a Series (flatten if needed)
    if isinstance(prices, pd.DataFrame):
        prices = prices.squeeze()

    # Calculate monthly returns (percentage change)
    monthly_returns = prices.pct_change()

    return monthly_returns


def calculate_future_value_actual(initial_value, monthly_investment, monthly_returns, start_date):
    """
    Calculate future value using actual historical monthly returns.

    Args:
        initial_value: Initial investment amount
        monthly_investment: Amount invested each month
        monthly_returns: Series of actual monthly returns
        start_date: Investment start date

    Returns:
        Tuple of (final_value, total_invested, total_return, return_pct, irr, annual_summary)
    """
    # Filter returns starting from start_date
    monthly_returns = monthly_returns[monthly_returns.index >= start_date]
    monthly_returns = monthly_returns.dropna()

    if len(monthly_returns) == 0:
        raise ValueError(f"No data available starting from {start_date}")

    balance = initial_value
    total_invested = initial_value

    balances = []
    invested_amounts = []
    dates = []

    # Track year-end values
    year_end_data = {}
    prev_year_end_balance = None

    for i, (date, ret) in enumerate(monthly_returns.items()):
        if i > 0:  # Skip first month (already have initial value)
            # Add monthly investment at the beginning of the month
            balance += monthly_investment
            total_invested += monthly_investment

        # Apply monthly return (ensure ret is a scalar)
        ret_value = float(ret) if not pd.isna(ret) else 0.0
        balance = balance * (1 + ret_value)

        balances.append(balance)
        invested_amounts.append(total_invested)
        dates.append(date)

        # Track year-end values
        year = date.year
        if year not in year_end_data:
            year_end_data[year] = {
                'start_balance': prev_year_end_balance if prev_year_end_balance else initial_value,
                'start_invested': invested_amounts[0] if i == 0 else year_end_data.get(year-1, {}).get('end_invested', initial_value)
            }

        year_end_data[year]['end_balance'] = balance
        year_end_data[year]['end_invested'] = total_invested
        year_end_data[year]['end_date'] = date
        prev_year_end_balance = balance

    final_value = balance
    total_return = final_value - total_invested
    return_pct = (total_return / total_invested) * 100

    # Calculate IRR (Internal Rate of Return)
    # Cash flows: initial investment, monthly investments, final value
    N = len(monthly_returns)
    cash_flows = [-initial_value] + [-monthly_investment] * (N - 1) + [final_value]

    monthly_irr = npf.irr(cash_flows)

    # Convert monthly IRR to annualized IRR
    if monthly_irr is not None and not pd.isna(monthly_irr) and monthly_irr > -1:
        irr = ((1 + monthly_irr) ** 12 - 1) * 100
    else:
        irr = 0

    # Build annual summary
    annual_summary = []
    for year in sorted(year_end_data.keys()):
        data = year_end_data[year]
        start_bal = data['start_balance']
        end_bal = data['end_balance']
        end_inv = data['end_invested']

        # Calculate annual return
        annual_return = ((end_bal - start_bal) / start_bal * 100) if start_bal > 0 else 0

        annual_summary.append({
            'Year': year,
            'End Value': end_bal,
            'Total Invested': end_inv,
            'Annual Return': annual_return
        })

    return final_value, total_invested, total_return, return_pct, irr, annual_summary


def calculate_future_value_annual_rate(initial_value, monthly_investment, annual_rate, num_months):
    """
    Calculate future value using a constant annual rate.

    Args:
        initial_value: Initial investment amount
        monthly_investment: Amount invested each month
        annual_rate: Annual return rate (e.g., 0.10 for 10%)
        num_months: Number of months to invest

    Returns:
        Tuple of (final_value, total_invested, total_return)
    """
    monthly_rate = (1 + annual_rate) ** (1/12) - 1

    balance = initial_value
    total_invested = initial_value

    for month in range(num_months):
        if month > 0:
            balance += monthly_investment
            total_invested += monthly_investment

        balance = balance * (1 + monthly_rate)

    final_value = balance
    total_return = final_value - total_invested
    return_pct = (total_return / total_invested) * 100

    return final_value, total_invested, total_return, return_pct


def parse_date(date_string):
    """Parse date string in YYYY-MM-DD format."""
    try:
        return datetime.strptime(date_string, '%Y-%m-%d')
    except ValueError:
        raise argparse.ArgumentTypeError(f"Invalid date format: {date_string}. Use YYYY-MM-DD")


def main():
    parser = argparse.ArgumentParser(
        description='Calculate future value of investments in S&P 500 using actual historical data',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --initial 10000 --monthly 500 --start 2020-01-01 --end 2024-12-31
  %(prog)s -i 5000 -m 1000 -s 2015-06-01 -e 2025-01-01 --annual-rate 0.12
        """
    )

    parser.add_argument('-i', '--initial', type=float, required=True,
                        help='Initial investment amount ($)')
    parser.add_argument('-m', '--monthly', type=float, required=True,
                        help='Monthly investment amount ($)')
    parser.add_argument('-s', '--start', type=parse_date, required=True,
                        help='Investment start date (YYYY-MM-DD)')
    parser.add_argument('-e', '--end', type=parse_date, required=True,
                        help='Investment end date (YYYY-MM-DD)')
    parser.add_argument('-r', '--annual-rate', type=float, default=0.10,
                        help='Representative annual return rate for comparison (default: 0.10 = 10%%)')

    args = parser.parse_args()

    # Validate inputs
    if args.initial < 0 or args.monthly < 0:
        print("Error: Investment amounts must be positive", file=sys.stderr)
        sys.exit(1)

    if args.start >= args.end:
        print("Error: Start date must be before end date", file=sys.stderr)
        sys.exit(1)

    # Download data (fetch a bit earlier to ensure we have the starting month)
    data_start = args.start - timedelta(days=60)

    try:
        sp500_data = download_sp500_data(data_start, args.end)
        monthly_returns = calculate_monthly_returns(sp500_data)

        # Calculate using actual historical returns
        print("=" * 70)
        print("ACTUAL S&P 500 HISTORICAL RETURNS")
        print("=" * 70)

        final_actual, invested_actual, return_actual, return_pct_actual, irr_actual, annual_summary = \
            calculate_future_value_actual(args.initial, args.monthly, monthly_returns, args.start)

        num_months = len(monthly_returns[monthly_returns.index >= args.start].dropna())
        years = num_months / 12

        print(f"Initial Investment:    ${args.initial:,.2f}")
        print(f"Monthly Investment:    ${args.monthly:,.2f}")
        print(f"Investment Period:     {args.start.strftime('%Y-%m-%d')} to {args.end.strftime('%Y-%m-%d')}")
        print(f"Duration:              {years:.2f} years ({num_months} months)")
        print(f"\nTotal Invested:        ${invested_actual:,.2f}")
        print(f"Final Value:           ${final_actual:,.2f}")
        print(f"Total Return:          ${return_actual:,.2f} ({return_pct_actual:+.2f}%)")
        print(f"IRR (Annualized):      {irr_actual:.2f}%")

        # Calculate using representative annual rate
        print(f"\n{'=' * 70}")
        print(f"CONSTANT ANNUAL RATE COMPARISON ({args.annual_rate * 100:.1f}% annually)")
        print("=" * 70)

        final_rate, invested_rate, return_rate, return_pct_rate = \
            calculate_future_value_annual_rate(args.initial, args.monthly, args.annual_rate, num_months)

        print(f"Initial Investment:    ${args.initial:,.2f}")
        print(f"Monthly Investment:    ${args.monthly:,.2f}")
        print(f"Annual Return Rate:    {args.annual_rate * 100:.1f}%")
        print(f"Duration:              {years:.2f} years ({num_months} months)")
        print(f"\nTotal Invested:        ${invested_rate:,.2f}")
        print(f"Final Value:           ${final_rate:,.2f}")
        print(f"Total Return:          ${return_rate:,.2f} ({return_pct_rate:+.2f}%)")

        # Comparison
        print(f"\n{'=' * 70}")
        print("COMPARISON")
        print("=" * 70)
        difference = final_actual - final_rate
        diff_pct = (difference / final_rate) * 100 if final_rate > 0 else 0

        print(f"Actual vs {args.annual_rate * 100:.1f}% Rate: ${difference:+,.2f} ({diff_pct:+.2f}%)")

        if difference > 0:
            print(f"\nActual historical returns performed BETTER than {args.annual_rate * 100:.1f}% annual rate")
        elif difference < 0:
            print(f"\nActual historical returns performed WORSE than {args.annual_rate * 100:.1f}% annual rate")
        else:
            print(f"\nActual historical returns matched {args.annual_rate * 100:.1f}% annual rate")

        # Display annual summary table
        if annual_summary:
            print(f"\n{'=' * 70}")
            print("ANNUAL BREAKDOWN")
            print("=" * 70)
            print("Note: Portfolio Growth % includes both market returns AND new contributions")
            print("-" * 70)
            print(f"{'Year':<8} {'End Value':>15} {'Total Invested':>15} {'Portfolio Growth':>17}")
            print("-" * 70)

            for year_data in annual_summary:
                year = year_data['Year']
                end_value = year_data['End Value']
                total_inv = year_data['Total Invested']
                ann_ret = year_data['Annual Return']

                print(f"{year:<8} ${end_value:>14,.2f} ${total_inv:>14,.2f} {ann_ret:>16.2f}%")

        print()

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
