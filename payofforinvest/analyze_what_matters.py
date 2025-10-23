#!/usr/bin/env python3
"""
Analyze what value actually matters for liquidation risk.

The question: What triggers forced liquidation?

Option A: Total value goes negative
  Total = Home + Investment - Interest Paid
  Problem: This includes the home value, but you can't liquidate the home
           while you're living in it!

Option B: Investment value < Principal Remaining
  This is the REAL trigger:
  - You owe $X on the mortgage
  - Your investment is worth $Y
  - If Y < X, you can't pay off the mortgage even if you liquidate everything
  - This is when you're truly underwater

Let's check both scenarios with real data.
"""

import json

with open('sp500_monthly_returns.json', 'r') as f:
    sp500_data = json.load(f)

all_dates = sorted(sp500_data.keys())

def analyze_scenario2_realistic(home_price, annual_rate, years, returns, start_date):
    """Analyze when INVESTMENT < PRINCIPAL (the real danger point)."""
    monthly_rate = annual_rate / 12
    num_months = years * 12

    # Calculate monthly payment
    r = monthly_rate
    n = num_months
    one_plus_r_to_n = (1 + r) ** n
    monthly_payment = home_price * (r * one_plus_r_to_n) / (one_plus_r_to_n - 1)

    monthly_data = []
    investment_value = home_price
    interest_paid = 0.0
    principal_remaining = home_price

    min_total_value = float('inf')
    min_total_month = None

    min_investment_vs_principal = float('inf')
    min_ivp_month = None

    for month in range(num_months):
        # Grow investment
        investment_value *= (1 + returns[month])

        # Track mortgage
        interest_payment = principal_remaining * monthly_rate
        principal_payment = monthly_payment - interest_payment
        interest_paid += interest_payment
        principal_remaining = max(0, principal_remaining - principal_payment)

        # Total value (mathematical)
        total_value = home_price + investment_value - interest_paid

        # Investment vs Principal (REAL danger metric)
        investment_vs_principal = investment_value - principal_remaining

        # Track minimums
        if total_value < min_total_value:
            min_total_value = total_value
            min_total_month = month + 1

        if investment_vs_principal < min_investment_vs_principal:
            min_investment_vs_principal = investment_vs_principal
            min_ivp_month = month + 1

        monthly_data.append({
            'month': month + 1,
            'investment_value': investment_value,
            'principal_remaining': principal_remaining,
            'interest_paid': interest_paid,
            'total_value': total_value,
            'investment_vs_principal': investment_vs_principal,
            'can_pay_off_mortgage': investment_value >= principal_remaining
        })

    return {
        'monthly_data': monthly_data,
        'min_total_value': min_total_value,
        'min_total_month': min_total_month,
        'min_investment_vs_principal': min_investment_vs_principal,
        'min_ivp_month': min_ivp_month,
        'monthly_payment': monthly_payment
    }

print("=" * 100)
print("WHAT VALUE ACTUALLY MATTERS?")
print("=" * 100)
print()

# Test the Great Depression scenario
home_price = 500000
annual_rate = 0.10
years = 30
start_date = '1929-09'

start_idx = all_dates.index(start_date)
num_months = years * 12
returns = [sp500_data[all_dates[start_idx + i]] for i in range(num_months)]

result = analyze_scenario2_realistic(home_price, annual_rate, years, returns, start_date)

print(f"Test Case: $500k home, 10% rate, 30 years, starting {start_date}")
print(f"Monthly payment: ${result['monthly_payment']:,.2f}")
print()

print("COMPARISON OF TWO METRICS:")
print("-" * 100)
print()

print("Metric A: Total Value (Home + Investment - Interest Paid)")
print(f"  Minimum: ${result['min_total_value']:,.2f}")
print(f"  Occurred: Month {result['min_total_month']}")
print(f"  Goes negative? {'YES' if result['min_total_value'] < 0 else 'NO'}")
print()

print("Metric B: Investment Value - Principal Remaining (Can you pay off mortgage?)")
print(f"  Minimum: ${result['min_investment_vs_principal']:,.2f}")
print(f"  Occurred: Month {result['min_ivp_month']}")
print(f"  Goes negative? {'YES - CANNOT PAY OFF MORTGAGE' if result['min_investment_vs_principal'] < 0 else 'NO - CAN PAY OFF MORTGAGE'}")
print()

print("=" * 100)
print("DETAILED TIMELINE")
print("=" * 100)
print()

print(f"{'Month':>5} {'Year':>6} | {'Investment':>14} {'Principal Owed':>14} {'Can Pay Off?':>15} | {'Total Value':>14}")
print("-" * 100)

start_year = 1929
for m in result['monthly_data']:
    month_num = m['month']
    year = start_year + (month_num - 1) // 12
    month = ((month_num - 1) % 12) + 1

    # Show first year, around key points, and last year
    show = (month_num <= 12 or
            abs(month_num - result['min_ivp_month']) <= 3 or
            abs(month_num - result['min_total_month']) <= 3 or
            month_num > num_months - 12)

    if show:
        can_pay = 'YES' if m['can_pay_off_mortgage'] else 'NO ⚠️'
        marker = ''
        if month_num == result['min_ivp_month']:
            marker = ' ← MIN I-P'
        elif month_num == result['min_total_month']:
            marker = ' ← MIN TOTAL'

        print(f"{month_num:5} {year:6} | ${m['investment_value']:13,.0f} ${m['principal_remaining']:13,.0f} {can_pay:>15} | ${m['total_value']:13,.0f}{marker}")

        if month_num == 12:
            print("  ...")
        elif month_num == result['min_ivp_month'] + 4 or month_num == result['min_total_month'] + 4:
            print("  ...")
        elif month_num == num_months - 12:
            print("  ...")

print()

print("=" * 100)
print("ANALYSIS")
print("=" * 100)
print()

# Find when investment first drops below principal
first_underwater_month = None
for m in result['monthly_data']:
    if not m['can_pay_off_mortgage']:
        first_underwater_month = m['month']
        break

if first_underwater_month:
    print(f"Investment drops below principal at month {first_underwater_month}")
    print(f"Total value goes negative at month {result['min_total_month']}")
    print()

    if first_underwater_month < result['min_total_month']:
        print("KEY INSIGHT: Investment becomes insufficient to pay off mortgage")
        print("             BEFORE total value goes negative.")
        print()
        print("This means:")
        print("  - You can't pay off the mortgage even if you liquidate")
        print("  - But your 'total value' is still positive because of home equity")
        print("  - The REAL danger is Investment < Principal, not Total < 0")
    else:
        print("In this case, total value goes negative first")
else:
    print("Investment NEVER drops below principal remaining!")
    print("You could always pay off the mortgage if needed.")

print()
print("=" * 100)
print("CONCLUSION")
print("=" * 100)
print()

print("We should track and warn about TWO things:")
print()
print("1. INVESTMENT < PRINCIPAL (Primary danger)")
print("   - You cannot pay off the mortgage even if you liquidate everything")
print("   - This is when you're truly trapped")
print("   - This happens EARLIER than total going negative")
print()
print("2. TOTAL VALUE < 0 (Secondary indicator)")
print("   - Mathematical calculation goes negative")
print("   - May not reflect real liquidation constraints")
print("   - Useful but not the primary concern")
print()

print("RECOMMENDATION: Warn primarily about Investment < Principal")
