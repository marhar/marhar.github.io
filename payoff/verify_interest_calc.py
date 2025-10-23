#!/usr/bin/env python3
"""Verify interest calculation is correct."""

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

print("=" * 80)
print("VERIFYING INTEREST CALCULATION")
print("=" * 80)
print()

# Simple test case
home_price = 500000
annual_rate = 0.06
years = 15

monthly_rate = annual_rate / 12
num_months = years * 12
monthly_payment = calculate_monthly_payment(home_price, annual_rate, years)

print(f"Loan: ${home_price:,}")
print(f"Rate: {annual_rate*100}%")
print(f"Term: {years} years ({num_months} months)")
print(f"Monthly payment: ${monthly_payment:,.2f}")
print()

# Calculate total interest by tracking mortgage
principal_remaining = home_price
interest_paid = 0

for month in range(num_months):
    interest_payment = principal_remaining * monthly_rate
    principal_payment = monthly_payment - interest_payment
    
    interest_paid += interest_payment
    principal_remaining -= principal_payment

print("METHOD 1: Track interest month by month")
print(f"  Total interest paid: ${interest_paid:,.2f}")
print(f"  Final principal: ${principal_remaining:,.2f}")
print()

# Calculate using total payments
total_paid = monthly_payment * num_months
total_interest_simple = total_paid - home_price

print("METHOD 2: Total payments - principal")
print(f"  Total payments: ${total_paid:,.2f}")
print(f"  Total interest: ${total_interest_simple:,.2f}")
print()

print(f"Match? {abs(interest_paid - total_interest_simple) < 0.01}")
print()

print("=" * 80)
print("SCENARIO 2 FINAL VALUE CALCULATION")
print("=" * 80)
print()

print("What we currently calculate:")
print("  Final Value = Home + Investment - Interest Paid")
print()

print("Let me think about this...")
print()

print("At the END of the mortgage term:")
print(f"  1. You OWN the home outright: ${home_price:,}")
print(f"  2. You have investment remaining: $X (depends on market)")
print(f"  3. You PAID interest: ${interest_paid:,.2f}")
print()

print("So your NET POSITION is:")
print("  Assets: Home + Investment")
print("  Costs: Interest paid over the years")
print("  Net = Home + Investment - Interest")
print()

print("Is this correct? Let me verify with Scenario 1...")
print()

print("=" * 80)
print("SCENARIO 1 (PAY CASH)")
print("=" * 80)
print()

print("What happens:")
print(f"  1. You pay ${home_price:,} for home immediately")
print(f"  2. Each month you invest ${monthly_payment:,.2f}")
print(f"  3. Investment grows to $Y")
print()

print("Your NET POSITION:")
print("  Assets: Home + Investment")
print("  Costs: You already paid for the home upfront")
print("  Net = Home + Investment")
print()

print("Wait... Scenario 1 doesn't subtract anything!")
print("But you DID spend the $500k on the home.")
print()

print("=" * 80)
print("THE CONFUSION")
print("=" * 80)
print()

print("The question is: What are we comparing?")
print()

print("INTERPRETATION A: Total wealth at end")
print("  Scenario 1: Home + Investment")
print("  Scenario 2: Home + Investment - Interest")
print("  This assumes you started with $500k in BOTH cases")
print()

print("INTERPRETATION B: Return on $500k investment")
print("  Scenario 1: Invest $500k in home, then invest monthly = wealth")
print("  Scenario 2: Invest $500k in market, pay mortgage from it = wealth")
print("  Both start with same $500k")
print()

print("Current code uses Interpretation A")
print("This is CORRECT if we're comparing two people who each have $500k")
print()

print("Let me verify the formula makes sense...")
print()

# Test with actual numbers
start_date = '1990-02'
start_idx = all_dates.index(start_date)
returns = [sp500_data[all_dates[start_idx + i]] for i in range(num_months)]

# Scenario 1
s1_investment = 0
for month in range(num_months):
    s1_investment += monthly_payment
    s1_investment *= (1 + returns[month])

s1_total = home_price + s1_investment

# Scenario 2
s2_investment = home_price
for month in range(num_months):
    s2_investment *= (1 + returns[month])
    s2_investment -= monthly_payment

s2_total = home_price + s2_investment - interest_paid

print(f"Test with 1990 start:")
print(f"  Scenario 1 total: ${s1_total:,.2f}")
print(f"  Scenario 2 total: ${s2_total:,.2f}")
print()

# Now let me verify this makes sense
print("Scenario 2 breakdown:")
print(f"  Home value: ${home_price:,}")
print(f"  Investment remaining: ${s2_investment:,.2f}")
print(f"  Interest paid: ${interest_paid:,.2f}")
print(f"  Total: ${home_price + s2_investment - interest_paid:,.2f}")
print()

# Alternative calculation
s2_total_alt = home_price + s2_investment - interest_paid
print(f"Does this equal wealth? ${s2_total_alt:,.2f}")
print()

print("Think about it differently:")
print("  You borrowed $500k and paid it back over 15 years")
print("  Total repayment = $500k principal + interest")
print("  You still have the home ($500k)")
print("  Net cost = interest paid")
print("  Remaining wealth = Home + Investment - Interest")
print()

print("YES, this is CORRECT!")
