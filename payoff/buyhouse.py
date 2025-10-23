#!/usr/bin/env python3
"""
Compare two investment scenarios:
1. Pay cash for home and invest monthly payments
2. Get mortgage and invest cash upfront

Uses actual historical S&P 500 monthly returns to demonstrate sequence of return risk.
"""

import math
import sys
import warnings
from datetime import datetime

warnings.filterwarnings('ignore', category=DeprecationWarning)
warnings.filterwarnings('ignore', category=FutureWarning)

try:
    import yfinance as yf
    import pandas as pd
    import numpy as np
except ImportError:
    print("Error: Required packages not installed.")
    print("Please install: pip install yfinance pandas numpy")
    sys.exit(1)


def calculate_monthly_payment(balance, rate_annual, term_years):
    """Calculate monthly mortgage payment using amortization formula."""
    rate_monthly = rate_annual / 12
    num_payments = term_years * 12
    
    if rate_monthly == 0:
        return balance / num_payments
    
    payment = balance * (rate_monthly * (1 + rate_monthly) ** num_payments) / \
              ((1 + rate_monthly) ** num_payments - 1)
    return payment


def calculate_total_interest(balance, rate_annual, term_years):
    """Calculate total interest paid over the mortgage term."""
    payment = calculate_monthly_payment(balance, rate_annual, term_years)
    total_paid = payment * term_years * 12
    return total_paid - balance


def get_sp500_monthly_returns(start_year, num_months):
    """Download historical S&P 500 monthly returns starting from a specific year."""
    start_date = f"{start_year}-01-01"
    
    # Download S&P 500 data
    sp500 = yf.download("^GSPC", start=start_date, progress=False, auto_adjust=True)
    
    # Calculate monthly returns using Close price (auto-adjusted)
    if 'Close' in sp500.columns:
        prices = sp500['Close']
    else:
        # Handle multi-index columns
        prices = sp500['Close'].squeeze()
    
    monthly_prices = prices.resample('M').last()
    monthly_returns = monthly_prices.pct_change().dropna()
    
    if len(monthly_returns) < num_months:
        print(f"Warning: Only {len(monthly_returns)} months of data available since {start_year}")
        print(f"Requested {num_months} months ({num_months/12:.1f} years)")
    
    # Return the required number of months
    return monthly_returns.iloc[:num_months].values


def calculate_investment_value_monthly_historical(monthly_amount, monthly_returns):
    """
    Calculate final value of monthly investments using actual historical returns.
    Each monthly investment grows with the actual market returns from that point forward.
    """
    total_value = 0.0
    num_months = len(monthly_returns)
    
    for i in range(num_months):
        investment = float(monthly_amount)
        # This investment grows for the remaining months
        for j in range(i, num_months):
            investment *= (1 + float(np.asarray(monthly_returns[j]).item()))
        total_value += investment
    
    return float(total_value)


def calculate_investment_value_lump_historical(amount, monthly_returns):
    """Calculate final value of lump sum investment using actual historical returns."""
    value = float(amount)
    for monthly_return in monthly_returns:
        value *= (1 + float(np.asarray(monthly_return).item()))
    return float(value)


def scenario_pay_cash(balance, mortgage_rate, term_years, monthly_returns, track_monthly=False):
    """
    Scenario 1: Pay cash for home, invest monthly payments.
    Returns: final total value, investment value, and optionally monthly tracking
    """
    monthly_payment = calculate_monthly_payment(balance, mortgage_rate, term_years)
    
    if track_monthly:
        monthly_data = []
        num_months = len(monthly_returns)
        
        for month in range(num_months):
            # Calculate investment value up to this month
            total_invested = monthly_payment * (month + 1)
            investment_value = 0.0
            
            for i in range(month + 1):
                investment = float(monthly_payment)
                for j in range(i, month + 1):
                    investment *= (1 + float(np.asarray(monthly_returns[j]).item()))
                investment_value += investment
            
            total_value = balance + investment_value
            monthly_data.append({
                'month': month + 1,
                'invested': total_invested,
                'investment_value': investment_value,
                'total_value': total_value
            })
        
        final_value = monthly_data[-1]['total_value']
        final_investment = monthly_data[-1]['investment_value']
        return final_value, final_investment, monthly_data
    else:
        investment_value = calculate_investment_value_monthly_historical(
            monthly_payment, monthly_returns
        )
        total_value = balance + investment_value
        return total_value, investment_value, None


def scenario_invest(balance, mortgage_rate, term_years, monthly_returns, track_monthly=False):
    """
    Scenario 2: Get mortgage, invest cash upfront.
    Returns: final total value, investment value, and optionally monthly tracking
    """
    monthly_payment = calculate_monthly_payment(balance, mortgage_rate, term_years)
    total_interest = calculate_total_interest(balance, mortgage_rate, term_years)
    
    if track_monthly:
        monthly_data = []
        num_months = len(monthly_returns)
        
        # Track mortgage principal remaining
        rate_monthly = mortgage_rate / 12
        principal_remaining = balance
        interest_paid = 0.0
        
        for month in range(num_months):
            # Calculate investment value up to this month
            investment_value = float(balance)
            for j in range(month + 1):
                investment_value *= (1 + float(np.asarray(monthly_returns[j]).item()))
            
            # Calculate mortgage status
            interest_payment = principal_remaining * rate_monthly
            principal_payment = monthly_payment - interest_payment
            interest_paid += interest_payment
            principal_remaining -= principal_payment
            
            # Total value = home + investment - interest paid so far
            total_value = balance + investment_value - interest_paid
            
            monthly_data.append({
                'month': month + 1,
                'investment_value': investment_value,
                'interest_paid': interest_paid,
                'principal_remaining': max(0, principal_remaining),
                'total_value': total_value
            })
        
        final_value = monthly_data[-1]['total_value']
        final_investment = monthly_data[-1]['investment_value']
        return final_value, final_investment, monthly_data
    else:
        investment_value = calculate_investment_value_lump_historical(balance, monthly_returns)
        total_value = balance - total_interest + investment_value
        return total_value, investment_value, None


def compare_scenarios(balance, mortgage_rate, term_years, start_year, track_monthly=False):
    """Compare both scenarios using historical market data."""
    num_months = term_years * 12
    
    print(f"Downloading S&P 500 data starting from {start_year}...")
    monthly_returns = get_sp500_monthly_returns(start_year, num_months)
    
    if len(monthly_returns) < num_months:
        print(f"Error: Insufficient data. Need {num_months} months, got {len(monthly_returns)}")
        sys.exit(1)
    
    monthly_payment = calculate_monthly_payment(balance, mortgage_rate, term_years)
    total_interest = calculate_total_interest(balance, mortgage_rate, term_years)
    
    value1, invest1, monthly1 = scenario_pay_cash(balance, mortgage_rate, term_years, 
                                                   monthly_returns, track_monthly)
    value2, invest2, monthly2 = scenario_invest(balance, mortgage_rate, term_years, 
                                                monthly_returns, track_monthly)
    
    # Calculate average annual return from the monthly returns
    cumulative_return = 1.0
    for r in monthly_returns:
        cumulative_return *= (1 + float(np.asarray(r).item()))
    avg_annual_return = (cumulative_return ** (1/term_years)) - 1
    
    return {
        'monthly_payment': monthly_payment,
        'total_interest': total_interest,
        'scenario1_value': value1,
        'scenario1_investment': invest1,
        'scenario1_monthly': monthly1,
        'scenario2_value': value2,
        'scenario2_investment': invest2,
        'scenario2_monthly': monthly2,
        'difference': value2 - value1,
        'avg_annual_return': avg_annual_return,
        'num_months': len(monthly_returns)
    }


def analyze_risk(balance, mortgage_rate, term_years, earliest_year=1928):
    """Analyze all possible starting dates to show sequence of return risk."""
    import datetime
    
    # Download all available data
    print("Downloading complete S&P 500 historical data...")
    sp500 = yf.download("^GSPC", start=f"{earliest_year}-01-01", progress=False, auto_adjust=True)
    
    if 'Close' in sp500.columns:
        prices = sp500['Close']
    else:
        prices = sp500['Close'].squeeze()
    
    monthly_prices = prices.resample('M').last()
    monthly_returns = monthly_prices.pct_change().dropna()
    
    num_months = term_years * 12
    available_starts = len(monthly_returns) - num_months
    
    if available_starts <= 0:
        print(f"Error: Not enough data. Need {num_months} months for {term_years} year term.")
        return
    
    print(f"Analyzing {available_starts} possible starting dates...")
    print(f"Term: {term_years} years, Interest rate: {mortgage_rate*100:.2f}%")
    print()
    
    results = []
    
    for start_idx in range(available_starts):
        start_date = monthly_returns.index[start_idx]
        period_returns = monthly_returns.iloc[start_idx:start_idx + num_months].values
        
        # Calculate both scenarios
        monthly_payment = calculate_monthly_payment(balance, mortgage_rate, term_years)
        total_interest = calculate_total_interest(balance, mortgage_rate, term_years)
        
        value1, invest1, _ = scenario_pay_cash(balance, mortgage_rate, term_years, period_returns, False)
        value2, invest2, _ = scenario_invest(balance, mortgage_rate, term_years, period_returns, False)
        
        # Calculate annual return
        cumulative_return = 1.0
        for r in period_returns:
            cumulative_return *= (1 + float(np.asarray(r).item()))
        avg_annual_return = (cumulative_return ** (1/term_years)) - 1
        
        results.append({
            'start_date': start_date,
            'start_year': start_date.year,
            'scenario1_value': value1,
            'scenario2_value': value2,
            'difference': value2 - value1,
            'winner': 'Mortgage' if value2 > value1 else ('Tie' if value2 == value1 else 'Pay Cash'),
            'avg_annual_return': avg_annual_return
        })
    
    # Summary statistics
    scenario1_wins = sum(1 for r in results if r['winner'] == 'Pay Cash')
    scenario2_wins = sum(1 for r in results if r['winner'] == 'Mortgage')
    ties = sum(1 for r in results if r['winner'] == 'Tie')
    
    differences = [r['difference'] for r in results]
    avg_difference = np.mean(differences)
    median_difference = np.median(differences)
    
    print("=" * 100)
    print("SEQUENCE OF RETURN RISK ANALYSIS")
    print("=" * 100)
    print()
    print(f"Total scenarios analyzed: {len(results)}")
    print(f"Scenario 1 (Pay Cash) wins: {scenario1_wins} ({scenario1_wins/len(results)*100:.1f}%)")
    print(f"Scenario 2 (Mortgage) wins: {scenario2_wins} ({scenario2_wins/len(results)*100:.1f}%)")
    if ties > 0:
        print(f"Ties: {ties}")
    print()
    print(f"Average difference: ${avg_difference:,.2f} {'in favor of Mortgage' if avg_difference > 0 else 'in favor of Pay Cash'}")
    print(f"Median difference: ${median_difference:,.2f} {'in favor of Mortgage' if median_difference > 0 else 'in favor of Pay Cash'}")
    print()
    
    # Best and worst cases
    best_mortgage = max(results, key=lambda x: x['difference'])
    worst_mortgage = min(results, key=lambda x: x['difference'])
    
    print("Best case for Mortgage strategy:")
    print(f"  Start: {best_mortgage['start_date'].strftime('%Y-%m')} (Avg return: {best_mortgage['avg_annual_return']*100:.2f}%/year)")
    print(f"  Advantage: ${best_mortgage['difference']:,.2f}")
    print()
    
    print("Worst case for Mortgage strategy (best for Pay Cash):")
    print(f"  Start: {worst_mortgage['start_date'].strftime('%Y-%m')} (Avg return: {worst_mortgage['avg_annual_return']*100:.2f}%/year)")
    print(f"  Disadvantage: ${abs(worst_mortgage['difference']):,.2f}")
    print()
    
    # Show distribution histogram
    print("=" * 100)
    print("DIFFERENCE DISTRIBUTION (Scenario 2 - Scenario 1)")
    print("=" * 100)
    
    # Create bins for histogram
    min_diff = min(differences)
    max_diff = max(differences)
    num_bins = 20
    bin_size = (max_diff - min_diff) / num_bins
    bins = [0] * num_bins
    
    for diff in differences:
        bin_idx = min(int((diff - min_diff) / bin_size), num_bins - 1)
        bins[bin_idx] += 1
    
    max_count = max(bins)
    bar_width = 50
    
    for i in range(num_bins):
        bin_start = min_diff + i * bin_size
        bin_end = bin_start + bin_size
        bar_len = int(bins[i] / max_count * bar_width) if max_count > 0 else 0
        bar = '█' * bar_len
        
        # Color negative (Pay Cash wins) vs positive (Mortgage wins)
        marker = '|' if bin_start <= 0 <= bin_end else ' '
        
        print(f"${bin_start:>10,.0f} to ${bin_end:>10,.0f} {marker} {bar} {bins[i]}")
    
    print()
    print("Legend: Values < 0 = Pay Cash wins, Values > 0 = Mortgage wins")
    print()
    
    # Show detailed results by decade
    print("=" * 100)
    print("RESULTS BY STARTING YEAR")
    print("=" * 100)
    print(f"{'Start':>10} {'End':>10} | {'Avg Return':>11} | {'Scenario 1':>15} {'Scenario 2':>15} {'Difference':>15} | {'Winner':>10}")
    print("-" * 100)
    
    # Group by starting year and show one per year
    by_year = {}
    for r in results:
        year = r['start_year']
        if year not in by_year:
            by_year[year] = r
    
    for year in sorted(by_year.keys()):
        r = by_year[year]
        end_year = r['start_date'].year + term_years
        print(f"{r['start_date'].strftime('%Y-%m'):>10} {end_year:>10} | "
              f"{r['avg_annual_return']*100:>10.2f}% | "
              f"${r['scenario1_value']:>14,.0f} ${r['scenario2_value']:>14,.0f} "
              f"${r['difference']:>14,.0f} | {r['winner']:>10}")
    
    print("-" * 100)
    
    return results


def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Compare paying cash vs investing with a mortgage using historical S&P 500 returns',
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
    parser.add_argument('start_year', type=int, nargs='?', default=1990,
                        help='Starting year for historical data')
    parser.add_argument('-b', '--balance', type=float, default=500000,
                        help='Home price / mortgage balance')
    parser.add_argument('-r', '--rate', type=float, default=0.07,
                        help='Annual mortgage interest rate (e.g., 0.07 for 7%%)')
    parser.add_argument('-t', '--term', type=int, default=30,
                        help='Mortgage term in years')
    parser.add_argument('-m', '--monthly', action='store_true',
                        help='Show month-by-month progress for both scenarios')
    parser.add_argument('--risk', action='store_true',
                        help='Analyze all possible starting dates to show sequence of return risk')
    
    args = parser.parse_args()
    
    balance = args.balance
    mortgage_rate = args.rate
    term_years = args.term
    start_year = args.start_year
    show_monthly = args.monthly
    show_risk = args.risk
    
    if show_risk:
        # Risk analysis mode
        analyze_risk(balance, mortgage_rate, term_years)
        return
    
    print("Investment vs. Cash Purchase Analysis")
    print("Using Historical S&P 500 Returns")
    print("=" * 60)
    print(f"Home Price:      ${balance:,.2f}")
    print(f"Mortgage Rate:   {mortgage_rate * 100:.2f}%")
    print(f"Term:            {term_years} years")
    print(f"Starting Year:   {start_year}")
    print()
    
    results = compare_scenarios(balance, mortgage_rate, term_years, start_year, show_monthly)
    
    print()
    print(f"Actual Average Annual Return: {results['avg_annual_return'] * 100:.2f}%")
    print(f"Data Points Used: {results['num_months']} months")
    print()
    print(f"Monthly Payment: ${results['monthly_payment']:,.2f}")
    print(f"Total Interest Paid: ${results['total_interest']:,.2f}")
    print()
    
    print("Scenario 1 - Pay Cash, Invest Monthly Payments:")
    print(f"  Investment Growth: ${results['scenario1_investment']:,.2f}")
    print(f"  Final Value (Home + Investments): ${results['scenario1_value']:,.2f}")
    print()
    
    print("Scenario 2 - Get Mortgage, Invest Lump Sum:")
    print(f"  Investment Growth: ${results['scenario2_investment']:,.2f}")
    print(f"  Final Value (Home - Interest + Investments): ${results['scenario2_value']:,.2f}")
    print()
    
    print(f"Difference: ${abs(results['difference']):,.2f}")
    
    if results['difference'] > 0:
        print("Result: Scenario 2 (Invest/Mortgage) is better")
    elif results['difference'] < 0:
        print("Result: Scenario 1 (Pay Cash) is better")
    else:
        print("Result: Both scenarios are equal")
    
    # Check for warning conditions in Scenario 2
    if results['scenario2_value'] < 0:
        print()
        print("*** WARNING: Scenario 2 has NEGATIVE total value! ***")
        print("The market crash was so severe that investment losses plus interest costs")
        print("exceeded the home value. This demonstrates extreme sequence of return risk.")
    elif results['scenario2_investment'] < results['total_interest']:
        print()
        print("*** NOTE: In Scenario 2, the investment value dropped below total interest paid.")
        print("This shows how devastating market crashes can be to lump-sum investments.")
    
    print()
    print("This demonstrates SEQUENCE OF RETURN RISK:")
    print("The actual outcome depends heavily on when you start investing")
    
    # Show monthly progress if requested
    if show_monthly:
        print("\n" + "=" * 120)
        print("MONTH-BY-MONTH PROGRESS")
        print("=" * 120)
        
        monthly1 = results['scenario1_monthly']
        monthly2 = results['scenario2_monthly']
        
        # Header
        print(f"\n{'Month':>5} {'Year':>6} | {'Scenario 1 (Pay Cash)':^45} | {'Scenario 2 (Mortgage)':^45} | {'Better':>10}")
        print(f"{'':>5} {'':>6} | {'Invested':>12} {'Inv Value':>14} {'Total':>14} | {'Inv Value':>14} {'Int Paid':>12} {'Total':>14} | {'':>10}")
        print("-" * 120)
        
        for i in range(len(monthly1)):
            m1 = monthly1[i]
            m2 = monthly2[i]
            month = m1['month']
            year = start_year + (month - 1) // 12
            month_in_year = ((month - 1) % 12) + 1
            
            # Determine which is better
            diff = m2['total_value'] - m1['total_value']
            if diff > 0:
                better = "Mortgage"
            elif diff < 0:
                better = "Pay Cash"
            else:
                better = "Tie"
            
            # Print every month, or every 12 months for long terms
            if term_years <= 15 or month % 12 == 0 or month == len(monthly1):
                print(f"{month:5d} {year:6d} | "
                      f"${m1['invested']:11,.0f} ${m1['investment_value']:13,.0f} ${m1['total_value']:13,.0f} | "
                      f"${m2['investment_value']:13,.0f} ${m2['interest_paid']:11,.0f} ${m2['total_value']:13,.0f} | "
                      f"{better:>10}")
        
        print("-" * 120)
        print(f"\nFinal Difference: ${abs(results['difference']):,.2f} in favor of {better}")


if __name__ == "__main__":
    main()
