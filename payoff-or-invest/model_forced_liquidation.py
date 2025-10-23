#!/usr/bin/env python3
"""
Model what REALLY happens if Scenario 2 goes negative.

In reality, if your investment balance drops below what you owe, you have choices:
1. Sell investments at a loss to pay off mortgage (forced liquidation)
2. Stop investing and pay mortgage from income (switch to cash flow payments)
3. Default on the mortgage (catastrophic)

We need to model realistic behavior, not just mathematical totals.
"""

import json

print("=" * 100)
print("MODELING REALISTIC SCENARIO 2 BEHAVIOR")
print("=" * 100)
print()

# Load data
with open('sp500_monthly_returns.json', 'r') as f:
    sp500_data = json.load(f)

all_dates = sorted(sp500_data.keys())

def calculate_realistic_scenario2(home_price, annual_rate, years, returns, start_date):
    """
    Model realistic behavior when investments can't cover mortgage.

    Strategy: If investment value drops below remaining principal,
    liquidate and pay off mortgage, then invest remaining cash.
    """
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
    liquidated = False
    liquidation_month = None

    for month in range(num_months):
        # Grow investment
        if not liquidated:
            investment_value *= (1 + returns[month])

        # Track mortgage payments
        interest_payment = principal_remaining * monthly_rate
        principal_payment = monthly_payment - interest_payment
        interest_paid += interest_payment
        principal_remaining = max(0, principal_remaining - principal_payment)

        # Check if we should liquidate
        # Strategy: If investment < remaining principal, we're in trouble
        if not liquidated and investment_value < principal_remaining:
            liquidated = True
            liquidation_month = month + 1

            # Liquidate: use all investment to pay down principal
            principal_remaining = max(0, principal_remaining - investment_value)
            investment_value = 0

            # From here on, we just pay mortgage from income (no more investing)

        # Calculate total value
        # = Home value + Investment - (Principal remaining + unpaid interest)
        total_value = home_price + investment_value - principal_remaining

        monthly_data.append({
            'month': month + 1,
            'investment_value': investment_value,
            'principal_remaining': principal_remaining,
            'interest_paid': interest_paid,
            'total_value': total_value,
            'liquidated': liquidated
        })

    final_value = monthly_data[-1]['total_value']

    return {
        'monthly_data': monthly_data,
        'final_value': final_value,
        'liquidated': liquidated,
        'liquidation_month': liquidation_month,
        'monthly_payment': monthly_payment
    }

# Test the worst case
print("TEST CASE: Great Depression Scenario")
print("$500k home, 10% rate, 30 years, starting Sept 1929")
print("-" * 100)
print()

home_price = 500000
annual_rate = 0.10
years = 30
start_date = '1929-09'

# Get returns
start_idx = all_dates.index(start_date)
num_months = years * 12
returns = [sp500_data[all_dates[start_idx + i]] for i in range(num_months)]

# Calculate with realistic behavior
result = calculate_realistic_scenario2(home_price, annual_rate, years, returns, start_date)

print(f"Monthly payment: ${result['monthly_payment']:,.2f}")
print()

if result['liquidated']:
    print(f"⚠️  FORCED LIQUIDATION at month {result['liquidation_month']}")
    print()

    liq_month = result['liquidation_month']
    start_year = 1929
    liq_year = start_year + (liq_month - 1) // 12
    liq_month_of_year = ((liq_month - 1) % 12) + 1

    print(f"Liquidation date: {liq_year}-{liq_month_of_year:02d}")
    print()

    # Show timeline around liquidation
    print("Timeline around liquidation:")
    for m in result['monthly_data']:
        month_num = m['month']

        if (month_num <= 12 or
            abs(month_num - liq_month) <= 6 or
            month_num > num_months - 12):

            year = start_year + (month_num - 1) // 12
            month = ((month_num - 1) % 12) + 1

            marker = " ← LIQUIDATION" if month_num == liq_month else ""
            status = " (paying from income)" if m['liquidated'] else " (investing)"

            print(f"  {year}-{month:02d} (Month {month_num:3d}): "
                  f"Investment ${m['investment_value']:>12,.0f}, "
                  f"Principal Owed ${m['principal_remaining']:>12,.0f}, "
                  f"Total ${m['total_value']:>12,.0f}{status}{marker}")

            if month_num == liq_month + 7:
                print("  ...")
            elif month_num == num_months - 12:
                print("  ...")
else:
    print("✓ No liquidation needed")

print()
print(f"Final total value: ${result['final_value']:,.2f}")
print()

# Compare with naive calculation (just letting it go negative)
print("=" * 100)
print("COMPARISON: Realistic vs Naive Calculation")
print("=" * 100)
print()

# Naive calculation (what we currently do)
naive_investment = home_price
for ret in returns:
    naive_investment *= (1 + ret)

total_interest = result['monthly_payment'] * num_months - home_price
naive_total = home_price + naive_investment - total_interest

print(f"NAIVE (current method):")
print(f"  Investment value: ${naive_investment:,.2f}")
print(f"  Total value: ${naive_total:,.2f}")
print()

print(f"REALISTIC (with forced liquidation):")
print(f"  Investment value: ${result['monthly_data'][-1]['investment_value']:,.2f}")
print(f"  Total value: ${result['final_value']:,.2f}")
print()

print(f"Difference: ${result['final_value'] - naive_total:,.2f}")
print()

if result['liquidated']:
    print("The realistic model is WORSE because:")
    print("  - Forced to sell at market bottom")
    print("  - Miss the recovery (no longer invested)")
    print("  - Still have to make all mortgage payments from income")
else:
    print("Both models agree (no liquidation needed)")

print()
print("=" * 100)
print("RECOMMENDATION FOR CALCULATOR")
print("=" * 100)
print()
print("We need to decide how to handle this:")
print()
print("Option A: Show NAIVE calculation (current)")
print("  + Simpler to understand")
print("  + Assumes you have other income to cover shortfalls")
print("  - Unrealistic when values go deeply negative")
print()
print("Option B: Show REALISTIC calculation (forced liquidation)")
print("  + More accurate to what would actually happen")
print("  + Shows true downside risk")
print("  - More complex to explain")
print()
print("Option C: Show BOTH and let user decide")
print("  + Most transparent")
print("  + Educational about risks")
print("  - More cluttered UI")
print()
print("RECOMMENDED: Option A with WARNINGS")
print("  - Keep current calculation (assumes income to cover)")
print("  - Add prominent warning when Scenario 2 goes negative")
print("  - Explain what this means in real life")
print("  - Show minimum value reached and when")
