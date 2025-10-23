#!/usr/bin/env python3
"""
Check for time periods where Scenario 2 total value goes negative.
This would happen if market crashes are severe enough that:
  Home Value + Investment Growth - Interest Paid < 0
"""

import json

print("=" * 100)
print("CHECKING FOR NEGATIVE SCENARIO 2 VALUES")
print("=" * 100)
print()

# Load S&P 500 data
with open('sp500_monthly_returns.json', 'r') as f:
    sp500_data = json.load(f)

# Get all available dates
all_dates = sorted(sp500_data.keys())
print(f"Total months of data available: {len(all_dates)}")
print(f"Date range: {all_dates[0]} to {all_dates[-1]}")
print()

def calculate_scenario2_monthly(home_price, annual_rate, years, returns):
    """Calculate Scenario 2 month-by-month to track when it might go negative."""
    monthly_rate = annual_rate / 12
    num_months = years * 12

    # Calculate monthly payment and total interest
    r = monthly_rate
    n = num_months
    one_plus_r_to_n = (1 + r) ** n
    monthly_payment = home_price * (r * one_plus_r_to_n) / (one_plus_r_to_n - 1)
    total_interest = (monthly_payment * num_months) - home_price

    monthly_data = []
    investment_value = home_price
    interest_paid = 0.0
    principal_remaining = home_price

    for month in range(num_months):
        # Grow investment
        investment_value *= (1 + returns[month])

        # Track mortgage
        interest_payment = principal_remaining * monthly_rate
        principal_payment = monthly_payment - interest_payment
        interest_paid += interest_payment
        principal_remaining -= principal_payment

        # Total value = home + investment - interest paid so far
        total_value = home_price + investment_value - interest_paid

        monthly_data.append({
            'month': month + 1,
            'investment_value': investment_value,
            'interest_paid': interest_paid,
            'total_value': total_value,
            'is_negative': total_value < 0
        })

    return monthly_data

# Test configurations
test_configs = [
    {'balance': 500000, 'rate': 0.07, 'term': 30, 'name': '$500k, 7%, 30y'},
    {'balance': 500000, 'rate': 0.10, 'term': 30, 'name': '$500k, 10%, 30y (high rate)'},
    {'balance': 1000000, 'rate': 0.07, 'term': 30, 'name': '$1M, 7%, 30y'},
]

print("TESTING DIFFERENT CONFIGURATIONS")
print("=" * 100)
print()

for config in test_configs:
    print(f"Configuration: {config['name']}")
    print("-" * 100)

    home_price = config['balance']
    annual_rate = config['rate']
    years = config['term']
    num_months = years * 12

    # Find worst possible starting period
    worst_period = None
    worst_min_value = float('inf')

    # Check all possible starting years
    for start_idx in range(len(all_dates) - num_months):
        start_date = all_dates[start_idx]

        # Get returns for this period
        returns = []
        for i in range(num_months):
            date_key = all_dates[start_idx + i]
            returns.append(sp500_data[date_key])

        # Calculate month-by-month
        monthly_data = calculate_scenario2_monthly(home_price, annual_rate, years, returns)

        # Find minimum total value in this period
        min_value = min(m['total_value'] for m in monthly_data)
        min_month = next(m for m in monthly_data if m['total_value'] == min_value)

        # Track worst period
        if min_value < worst_min_value:
            worst_min_value = min_value
            worst_period = {
                'start_date': start_date,
                'min_value': min_value,
                'min_month': min_month['month'],
                'monthly_data': monthly_data
            }

    # Report results
    if worst_period:
        print(f"  Worst starting period: {worst_period['start_date']}")
        print(f"  Minimum total value: ${worst_period['min_value']:,.2f}")
        print(f"  Occurred at month: {worst_period['min_month']}")

        if worst_period['min_value'] < 0:
            print(f"  ⚠️  WARNING: NEGATIVE VALUE REACHED!")
            print()
            print(f"  Timeline for {worst_period['start_date']}:")

            # Show month-by-month for first year and around the minimum
            for m in worst_period['monthly_data']:
                month_num = m['month']
                # Show first 12 months, around minimum, and last 12 months
                if (month_num <= 12 or
                    abs(month_num - worst_period['min_month']) <= 3 or
                    month_num > num_months - 12):

                    start_year = int(worst_period['start_date'][:4])
                    year = start_year + (month_num - 1) // 12
                    month = ((month_num - 1) % 12) + 1

                    marker = " ← MINIMUM" if month_num == worst_period['min_month'] else ""
                    warning = " ⚠️  NEGATIVE!" if m['is_negative'] else ""

                    print(f"    {year}-{month:02d} (Month {month_num:3d}): "
                          f"Investment ${m['investment_value']:>13,.2f}, "
                          f"Interest Paid ${m['interest_paid']:>13,.2f}, "
                          f"Total ${m['total_value']:>13,.2f}{marker}{warning}")
                elif month_num == worst_period['min_month'] - 4:
                    print(f"    ...")
        else:
            print(f"  ✓ Never goes negative (worst case: ${worst_period['min_value']:,.2f})")

    print()

# Now check Great Depression specifically (1929 start)
print()
print("SPECIAL CHECK: STARTING IN 1929 (GREAT DEPRESSION)")
print("=" * 100)
print()

# Find 1929-02 in data
start_1929 = '1929-02'
if start_1929 in all_dates:
    start_idx = all_dates.index(start_1929)

    for config in test_configs:
        home_price = config['balance']
        annual_rate = config['rate']
        years = config['term']
        num_months = years * 12

        if start_idx + num_months <= len(all_dates):
            # Get returns
            returns = []
            for i in range(num_months):
                returns.append(sp500_data[all_dates[start_idx + i]])

            # Calculate
            monthly_data = calculate_scenario2_monthly(home_price, annual_rate, years, returns)
            min_value = min(m['total_value'] for m in monthly_data)

            print(f"{config['name']}:")
            print(f"  Minimum total value: ${min_value:,.2f}")

            if min_value < 0:
                print(f"  ⚠️  GOES NEGATIVE!")
            else:
                print(f"  ✓ Stays positive")
else:
    print("No data for 1929")

print()
print("=" * 100)
