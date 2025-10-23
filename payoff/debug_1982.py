#!/usr/bin/env python3
"""Debug the 1982 scenario to see what's happening month by month."""

import json

with open('sp500_monthly_returns.json', 'r') as f:
    sp500_data = json.load(f)

all_dates = sorted(sp500_data.keys())

home_price = 500000
annual_rate = 0.03
years = 30
start_date = '1982-02'

# Calculate monthly payment
monthly_rate = annual_rate / 12
num_months = years * 12
r = monthly_rate
n = num_months
one_plus_r_to_n = (1 + r) ** n
monthly_payment = home_price * (r * one_plus_r_to_n) / (one_plus_r_to_n - 1)

print(f"Test: 1982, 3% rate, 30 years")
print(f"Monthly payment: ${monthly_payment:,.2f}")
print()

start_idx = all_dates.index(start_date)
returns = [sp500_data[all_dates[start_idx + i]] for i in range(num_months)]

# Track scenario 2
investment_value = home_price
principal_remaining = home_price
interest_paid = 0.0

min_investment_vs_principal = float('inf')
min_month = None

print("Checking key months:\n")

for month in range(num_months):
    # Apply market return
    investment_value *= (1 + returns[month])
    
    # Withdraw mortgage payment
    investment_value -= monthly_payment
    
    # Track mortgage
    interest_payment = principal_remaining * monthly_rate
    principal_payment = monthly_payment - interest_payment
    interest_paid += interest_payment
    principal_remaining -= principal_payment
    
    # Check investment vs principal
    gap = investment_value - principal_remaining
    
    if gap < min_investment_vs_principal:
        min_investment_vs_principal = gap
        min_month = month + 1
    
    # Show critical months
    if month < 12 or month > num_months - 12 or gap < 0:
        year = 1982 + month // 12
        month_of_year = (month % 12) + 1
        underwater = "⚠️ UNDERWATER" if gap < 0 else ""
        print(f"Month {month+1:3d} ({year}-{month_of_year:02d}): Inv=${investment_value:>13,.0f}, Principal=${principal_remaining:>13,.0f}, Gap=${gap:>13,.0f} {underwater}")

print()
print(f"Minimum gap: ${min_investment_vs_principal:,.2f} at month {min_month}")
print()

total_value = home_price + investment_value - interest_paid
print(f"Final investment value: ${investment_value:,.2f}")
print(f"Final principal remaining: ${principal_remaining:,.2f}")
print(f"Total interest paid: ${interest_paid:,.2f}")
print(f"Final total value: ${total_value:,.2f}")
print()

if min_investment_vs_principal < 0:
    print("❌ PROBLEM: Investment goes below principal!")
    print(f"   This triggers 'Cannot Pay Off Mortgage' warning")
    print(f"   But final value is positive: ${total_value:,.2f}")
else:
    print("✓ Investment always above principal")
