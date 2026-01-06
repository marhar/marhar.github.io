#!/usr/bin/env python3
"""
Independent verification using a completely different approach.
Calculates everything from scratch without using any existing functions.
"""

import json

print("=" * 100)
print("INDEPENDENT VERIFICATION - DIFFERENT APPROACH")
print("Test Case: $500,000 home, 7% rate, 30 years, starting 1990")
print("=" * 100)
print()

# Load S&P 500 data
with open('sp500_monthly_returns.json', 'r') as f:
    sp500_data = json.load(f)

# Parameters
home_price = 500000
annual_rate = 0.07
years = 30
start_year = 1990

monthly_rate = annual_rate / 12
num_months = years * 12

print("PART 1: MORTGAGE CALCULATIONS")
print("-" * 100)

# Calculate monthly payment (from scratch, no functions)
r = monthly_rate
n = num_months
one_plus_r_to_n = (1 + r) ** n
monthly_payment = home_price * (r * one_plus_r_to_n) / (one_plus_r_to_n - 1)

print(f"Monthly rate: {r}")
print(f"Number of payments: {n}")
print(f"(1 + r)^n: {one_plus_r_to_n}")
print(f"Monthly payment: ${monthly_payment:.2f}")
print()

# Calculate total interest
total_paid = monthly_payment * num_months
total_interest = total_paid - home_price
print(f"Total paid: ${total_paid:,.2f}")
print(f"Total interest: ${total_interest:,.2f}")
print()

print("PART 2: GET S&P 500 RETURNS")
print("-" * 100)

# Get returns starting from February 1990 (because pct_change drops first month)
returns = []
current_year = start_year
current_month = 2  # February

print("First 12 months of returns:")
for i in range(num_months):
    date_key = f"{current_year}-{current_month:02d}"

    if date_key in sp500_data:
        ret = sp500_data[date_key]
        returns.append(ret)

        if i < 12:
            print(f"  {date_key}: {ret:.6f} ({ret*100:+.2f}%)")
    else:
        print(f"ERROR: No data for {date_key}")
        break

    current_month += 1
    if current_month > 12:
        current_month = 1
        current_year += 1

print(f"\nTotal months loaded: {len(returns)}")
print()

# Calculate average return
cumulative = 1.0
for ret in returns:
    cumulative *= (1 + ret)
avg_annual_return = (cumulative ** (1/years)) - 1
print(f"Cumulative return: {cumulative:.4f}")
print(f"Average annual return: {avg_annual_return*100:.2f}%")
print()

print("PART 3: SCENARIO 1 - PAY CASH, INVEST MONTHLY")
print("-" * 100)

# Build month-by-month from scratch
scenario1_investment_value = 0.0

for invest_month in range(num_months):
    # This month we invest one monthly payment
    value = monthly_payment

    # It grows for the remaining months
    for growth_month in range(invest_month, num_months):
        value *= (1 + returns[growth_month])

    scenario1_investment_value += value

    # Show first few
    if invest_month < 3:
        print(f"Month {invest_month}: Invest ${monthly_payment:.2f}, grows to ${value:.2f}")

print(f"...")
print(f"Total investment value: ${scenario1_investment_value:,.2f}")

scenario1_total = home_price + scenario1_investment_value
print(f"Scenario 1 total: ${home_price:,} + ${scenario1_investment_value:,.2f}")
print(f"                = ${scenario1_total:,.2f}")
print()

print("PART 4: SCENARIO 2 - GET MORTGAGE, INVEST LUMP SUM")
print("-" * 100)

# Invest full home price upfront
scenario2_investment_value = home_price

# Grow it month by month
for month in range(num_months):
    scenario2_investment_value *= (1 + returns[month])

    # Show first few
    if month < 3:
        print(f"Month {month}: ${scenario2_investment_value:,.2f}")

print(f"...")
print(f"Total investment value: ${scenario2_investment_value:,.2f}")

scenario2_total = home_price + scenario2_investment_value - total_interest
print(f"Scenario 2 total: ${home_price:,} + ${scenario2_investment_value:,.2f} - ${total_interest:,.2f}")
print(f"                = ${scenario2_total:,.2f}")
print()

print("PART 5: COMPARISON")
print("-" * 100)

difference = scenario2_total - scenario1_total
winner = "Scenario 1 (Pay Cash)" if difference < 0 else "Scenario 2 (Mortgage)"

print(f"Scenario 1 (Pay Cash):    ${scenario1_total:,.2f}")
print(f"Scenario 2 (Mortgage):    ${scenario2_total:,.2f}")
print(f"Difference:               ${abs(difference):,.2f}")
print(f"Winner:                   {winner}")
print()

print("=" * 100)
print("EXPECTED VALUES (from Python original):")
print("=" * 100)
print(f"Monthly Payment:          $3,326.51")
print(f"Total Interest:           $697,544.49")
print(f"Scenario 1 Investment:    $4,229,054.79")
print(f"Scenario 1 Total:         $4,729,054.79")
print(f"Scenario 2 Investment:    $4,900,814.62")
print(f"Scenario 2 Total:         $4,703,270.13")
print(f"Winner:                   Scenario 1 by $25,784.66")
print()

print("=" * 100)
print("VERIFICATION:")
print("=" * 100)

def check(label, calculated, expected, tolerance=1.0):
    diff = abs(calculated - expected)
    status = "✓" if diff < tolerance else f"❌ (off by ${diff:,.2f})"
    print(f"{label:30} ${calculated:>14,.2f}  vs  ${expected:>14,.2f}  {status}")

check("Monthly Payment:", monthly_payment, 3326.51)
check("Total Interest:", total_interest, 697544.49)
check("Scenario 1 Investment:", scenario1_investment_value, 4229054.79)
check("Scenario 1 Total:", scenario1_total, 4729054.79)
check("Scenario 2 Investment:", scenario2_investment_value, 4900814.62)
check("Scenario 2 Total:", scenario2_total, 4703270.13)
check("Difference:", abs(difference), 25784.66)

print()
print("=" * 100)
