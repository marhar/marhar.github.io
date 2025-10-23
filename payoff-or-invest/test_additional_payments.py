#!/usr/bin/env python3
"""Test the additional payments calculation."""

import json

with open('sp500_monthly_returns.json', 'r') as f:
    sp500_data = json.load(f)

all_dates = sorted(sp500_data.keys())

def calculate_monthly_payment(balance, annual_rate, years):
    monthly_rate = annual_rate / 12
    num_months = years * 12
    r = monthly_rate
    n = num_months
    one_plus_r_to_n = (1 + r) ** n
    return balance * (r * one_plus_r_to_n) / (one_plus_r_to_n - 1)

# Test 2001 scenario
home_price = 500000
annual_rate = 0.06
years = 15
start_date = '2001-02'

monthly_payment = calculate_monthly_payment(home_price, annual_rate, years)

print(f"Testing 2001, 6%, 15 years")
print(f"Monthly payment: ${monthly_payment:,.2f}")
print()

start_idx = all_dates.index(start_date)
num_months = years * 12
returns = [sp500_data[all_dates[start_idx + i]] for i in range(num_months)]

investment_value = home_price
ran_out_month = None
additional_payments_needed = 0

for month in range(num_months):
    # Apply market return
    investment_value *= (1 + returns[month])
    
    # Try to withdraw payment
    if investment_value >= monthly_payment:
        investment_value -= monthly_payment
    else:
        if ran_out_month is None:
            ran_out_month = month + 1
            print(f"Investment depleted at month {ran_out_month}")
            print(f"  Investment before withdrawal: ${investment_value:,.2f}")
            print()
        
        # Use what's left, track shortfall
        if investment_value > 0:
            additional_payments_needed += (monthly_payment - investment_value)
            investment_value = 0
        else:
            additional_payments_needed += monthly_payment

print(f"Final results:")
print(f"  Ran out at month: {ran_out_month}")
print(f"  Remaining months: {num_months - ran_out_month}")
print(f"  Additional payments needed: ${additional_payments_needed:,.2f}")
print()

# Verify
remaining_months = num_months - ran_out_month
expected_if_full_months = monthly_payment * remaining_months
print(f"Verification:")
print(f"  If all remaining months needed full payment: ${expected_if_full_months:,.2f}")
print(f"  Actual (accounting for partial month): ${additional_payments_needed:,.2f}")
print(f"  Difference (partial month): ${expected_if_full_months - additional_payments_needed:,.2f}")
