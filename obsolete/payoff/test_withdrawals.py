#!/usr/bin/env python3
"""Test if the new withdrawal model depletes investment in Great Depression."""

import json

# Load S&P 500 data
with open('sp500_monthly_returns.json', 'r') as f:
    sp500_data = json.load(f)

all_dates = sorted(sp500_data.keys())

# Parameters
home_price = 500000
annual_rate = 0.07  # 7% mortgage
years = 30
start_date = '1929-02'  # Great Depression start

# Calculate monthly payment
monthly_rate = annual_rate / 12
num_months = years * 12
r = monthly_rate
n = num_months
one_plus_r_to_n = (1 + r) ** n
monthly_payment = home_price * (r * one_plus_r_to_n) / (one_plus_r_to_n - 1)

print(f"Testing Great Depression scenario:")
print(f"Home price: ${home_price:,}")
print(f"Mortgage rate: {annual_rate*100}%")
print(f"Term: {years} years")
print(f"Monthly payment: ${monthly_payment:,.2f}")
print(f"Start date: {start_date}")
print()

# Get returns starting from February 1929
start_idx = all_dates.index(start_date)
returns = [sp500_data[all_dates[start_idx + i]] for i in range(num_months)]

# Simulate Scenario 2 with withdrawals
investment_value = home_price
print(f"Initial investment: ${investment_value:,.2f}")
print()

ran_out_month = None
for month in range(num_months):
    # Apply market return
    investment_value *= (1 + returns[month])
    
    # Withdraw mortgage payment
    investment_value -= monthly_payment
    
    # Check if depleted
    if investment_value < 0 and ran_out_month is None:
        ran_out_month = month + 1
        year = 1929 + month // 12
        month_of_year = (month % 12) + 1
        print(f"💀 RAN OUT OF MONEY at month {ran_out_month}")
        print(f"   Date: {year}-{month_of_year:02d}")
        print(f"   Investment value: ${investment_value:,.2f}")
        print(f"   Time before depletion: {ran_out_month/12:.1f} years")
        print(f"   Remaining payments: {num_months - ran_out_month} ({(num_months - ran_out_month)/12:.1f} years)")
        print()
        break
    
    # Show progress for first 3 years
    if month < 36:
        year = 1929 + month // 12
        month_of_year = (month % 12) + 1
        print(f"Month {month+1:3d} ({year}-{month_of_year:02d}): Return {returns[month]*100:+7.2f}%, Investment ${investment_value:>14,.2f}")

if ran_out_month is None:
    print(f"\n✓ Investment survived! Final value: ${investment_value:,.2f}")
else:
    # Continue to show final deficit
    for month in range(ran_out_month, num_months):
        investment_value *= (1 + returns[month])
        investment_value -= monthly_payment
    
    print(f"Final deficit (if forced to continue): ${investment_value:,.2f}")
    print(f"Total shortfall: ${abs(investment_value):,.2f}")
