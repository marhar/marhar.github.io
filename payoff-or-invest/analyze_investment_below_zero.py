#!/usr/bin/env python3
"""
Analyze what it means when "investment value" appears to go below zero.

CRITICAL INSIGHT: Investment value CAN'T actually go below zero!
- You can't have negative shares of stock
- Worst case: investment goes to $0 (total loss)

So what does our calculation showing "negative investment" actually mean?
Let's investigate...
"""

import json

with open('sp500_monthly_returns.json', 'r') as f:
    sp500_data = json.load(f)

all_dates = sorted(sp500_data.keys())

print("=" * 100)
print("CAN INVESTMENT VALUE GO BELOW ZERO?")
print("=" * 100)
print()

# Test worst case scenario
home_price = 500000
annual_rate = 0.10
years = 30
start_date = '1929-09'

start_idx = all_dates.index(start_date)
num_months = years * 12
returns = [sp500_data[all_dates[start_idx + i]] for i in range(num_months)]

# Calculate investment value month by month
investment_value = home_price

print("Testing: Great Depression, starting Sept 1929")
print(f"Initial investment: ${investment_value:,.2f}")
print()
print("First 36 months:")
print()

min_investment = investment_value
min_month = 0

for month in range(min(36, num_months)):
    investment_value *= (1 + returns[month])

    if investment_value < min_investment:
        min_investment = investment_value
        min_month = month + 1

    year = 1929 + month // 12
    month_of_year = (month % 12) + 1

    print(f"  {year}-{month_of_year:02d} (Month {month+1:3d}): Return {returns[month]*100:+7.2f}% → Investment ${investment_value:>13,.2f}")

print()
print(f"Minimum investment value: ${min_investment:,.2f} at month {min_month}")
print(f"Investment went to zero? {'YES - TOTAL LOSS!' if min_investment <= 0 else 'NO'}")
print()

# Continue through all months
investment_value = home_price
for month in range(num_months):
    investment_value *= (1 + returns[month])
    if investment_value < min_investment:
        min_investment = investment_value
        min_month = month + 1

print(f"Over entire 30 year period:")
print(f"  Minimum investment: ${min_investment:,.2f}")
print(f"  Final investment: ${investment_value:,.2f}")
print()

print("=" * 100)
print("ANALYSIS")
print("=" * 100)
print()

print("FACT: Stock investment can NEVER go below $0")
print("      - You can't have negative shares")
print("      - Worst case: company goes bankrupt, value → $0")
print("      - S&P 500 is diversified, extremely unlikely to go to $0")
print()

print("HISTORICAL REALITY:")
print("  - Great Depression (1929-1932): S&P 500 dropped ~89%")
print(f"  - Our calculation: ${home_price:,} → ${min_investment:,.2f}")
print(f"  - That's a {((min_investment/home_price - 1)*100):.1f}% drop")
print(f"  - Still positive! Investment never went to $0")
print()

print("=" * 100)
print("WHAT SHOULD WE REPORT?")
print("=" * 100)
print()

print("Instead of worrying about 'investment < 0' (impossible),")
print("we should report:")
print()

print("1. MAXIMUM DRAWDOWN")
print("   - Percentage drop from peak")
print(f"   - Example: ${home_price:,} → ${min_investment:,.2f} = {((min_investment/home_price - 1)*100):.1f}% loss")
print("   - Shows severity of crash")
print()

print("2. INVESTMENT vs PRINCIPAL")
print("   - Can you pay off mortgage if needed?")
print("   - This is what actually matters")
print("   - Already tracking this!")
print()

print("3. INVESTMENT vs INTEREST PAID")
print("   - Is your investment even keeping up with interest costs?")
print("   - If investment < total interest paid, you're losing vs paying cash")
print()

print("4. TIME TO RECOVER")
print("   - How long until investment returns to initial value?")
print("   - Psychological factor - can you wait that long?")
print()

# Calculate some of these metrics
print("=" * 100)
print("ADDITIONAL METRICS TO TRACK")
print("=" * 100)
print()

# Monthly rate
monthly_rate = annual_rate / 12
r = monthly_rate
n = num_months
one_plus_r_to_n = (1 + r) ** n
monthly_payment = home_price * (r * one_plus_r_to_n) / (one_plus_r_to_n - 1)
total_interest = (monthly_payment * num_months) - home_price

investment_value = home_price
peak_investment = home_price
max_drawdown = 0
max_drawdown_month = 0
interest_paid = 0
principal_remaining = home_price

months_investment_below_interest = 0
recovered_to_initial = False
recovery_month = None

for month in range(num_months):
    # Grow investment
    investment_value *= (1 + returns[month])

    # Track peak and drawdown
    if investment_value > peak_investment:
        peak_investment = investment_value
        if not recovered_to_initial and investment_value >= home_price:
            recovered_to_initial = True
            recovery_month = month + 1

    drawdown = (investment_value - peak_investment) / peak_investment
    if drawdown < max_drawdown:
        max_drawdown = drawdown
        max_drawdown_month = month + 1

    # Track interest
    interest_payment = principal_remaining * monthly_rate
    interest_paid += interest_payment
    principal_payment = monthly_payment - interest_payment
    principal_remaining -= principal_payment

    # Check if investment < interest paid
    if investment_value < interest_paid:
        months_investment_below_interest += 1

print(f"Maximum Drawdown: {max_drawdown*100:.1f}% at month {max_drawdown_month}")
print(f"Peak Investment: ${peak_investment:,.2f}")
print()

print(f"Investment < Interest Paid for {months_investment_below_interest} months ({months_investment_below_interest*100/num_months:.1f}% of term)")
print()

if recovery_month:
    print(f"Investment recovered to initial ${home_price:,} at month {recovery_month} ({recovery_month/12:.1f} years)")
else:
    print(f"Investment NEVER recovered to initial ${home_price:,}")
print()

print("=" * 100)
print("RECOMMENDATION")
print("=" * 100)
print()

print("Report these KEY METRICS:")
print()
print("1. Can't Pay Off Mortgage (Investment < Principal)")
print("   ✓ Already tracking this - PRIMARY warning")
print()
print("2. Maximum Drawdown")
print("   → Add this - shows severity of crash")
print("   → Example: '86% loss from peak'")
print()
print("3. Investment < Interest Paid")
print("   → Add this - shows you're losing vs paying cash")
print("   → Example: 'Investment worth less than interest paid for 15 years'")
print()
print("4. Time to Recovery")
print("   → Add this - psychological reality")
print("   → Example: 'Takes 25 years to recover to initial value'")
print()

print("DON'T worry about 'Investment < 0' because:")
print("  - Mathematically impossible with stocks")
print("  - S&P 500 has never gone to zero")
print("  - Not a realistic concern")
