#!/usr/bin/env python3
"""
Verify JavaScript calculations match Python implementation.
This is critical for financial accuracy.
"""

import json
import sys

# Load the downloaded S&P 500 data
with open('sp500_monthly_returns.json', 'r') as f:
    sp500_returns = json.load(f)

def calculate_monthly_payment(balance, rate_annual, term_years):
    """Calculate monthly mortgage payment."""
    rate_monthly = rate_annual / 12
    num_payments = term_years * 12

    if rate_monthly == 0:
        return balance / num_payments

    payment = balance * (rate_monthly * (1 + rate_monthly) ** num_payments) / \
              ((1 + rate_monthly) ** num_payments - 1)
    return payment

def calculate_total_interest(balance, rate_annual, term_years):
    """Calculate total interest paid."""
    payment = calculate_monthly_payment(balance, rate_annual, term_years)
    total_paid = payment * term_years * 12
    return total_paid - balance

def get_monthly_returns(start_year, num_months):
    """Get monthly returns starting from FEBRUARY of start_year (to match Python pct_change behavior)."""
    returns = []
    current_year = start_year
    current_month = 2  # Start from February to match Python's pct_change() which drops first month

    for i in range(num_months):
        date_key = f"{current_year}-{current_month:02d}"
        if date_key in sp500_returns:
            returns.append(sp500_returns[date_key])
        else:
            print(f"ERROR: No data for {date_key}")
            break

        current_month += 1
        if current_month > 12:
            current_month = 1
            current_year += 1

    return returns

def calculate_investment_monthly(monthly_amount, monthly_returns):
    """Calculate value of monthly investments."""
    total_value = 0.0
    num_months = len(monthly_returns)

    for i in range(num_months):
        investment = monthly_amount
        # This investment grows for the remaining months
        for j in range(i, num_months):
            investment *= (1 + monthly_returns[j])
        total_value += investment

    return total_value

def calculate_investment_lump(amount, monthly_returns):
    """Calculate value of lump sum investment."""
    value = amount
    for monthly_return in monthly_returns:
        value *= (1 + monthly_return)
    return value

def scenario_pay_cash(balance, mortgage_rate, term_years, monthly_returns):
    """Scenario 1: Pay cash, invest monthly payments."""
    monthly_payment = calculate_monthly_payment(balance, mortgage_rate, term_years)
    investment_value = calculate_investment_monthly(monthly_payment, monthly_returns)
    total_value = balance + investment_value
    return total_value, investment_value

def scenario_invest(balance, mortgage_rate, term_years, monthly_returns):
    """Scenario 2: Get mortgage, invest lump sum."""
    total_interest = calculate_total_interest(balance, mortgage_rate, term_years)
    investment_value = calculate_investment_lump(balance, monthly_returns)
    total_value = balance - total_interest + investment_value
    return total_value, investment_value

# Test cases
test_cases = [
    {"balance": 500000, "rate": 0.07, "term": 30, "year": 1990},
    {"balance": 500000, "rate": 0.07, "term": 30, "year": 2000},
    {"balance": 500000, "rate": 0.07, "term": 30, "year": 2007},
    {"balance": 750000, "rate": 0.06, "term": 15, "year": 1995},
]

print("=" * 100)
print("VERIFICATION OF CALCULATIONS")
print("=" * 100)
print()

for test in test_cases:
    balance = test["balance"]
    rate = test["rate"]
    term = test["term"]
    year = test["year"]

    print(f"Test: Balance=${balance:,}, Rate={rate*100:.1f}%, Term={term}y, Year={year}")
    print("-" * 100)

    # Get returns
    num_months = term * 12
    monthly_returns = get_monthly_returns(year, num_months)

    if len(monthly_returns) < num_months:
        print(f"  SKIP: Insufficient data ({len(monthly_returns)} < {num_months})")
        print()
        continue

    # Calculate monthly payment and interest
    monthly_payment = calculate_monthly_payment(balance, rate, term)
    total_interest = calculate_total_interest(balance, rate, term)

    # Calculate both scenarios
    s1_total, s1_invest = scenario_pay_cash(balance, rate, term, monthly_returns)
    s2_total, s2_invest = scenario_invest(balance, rate, term, monthly_returns)

    # Calculate average return
    cumulative = 1.0
    for r in monthly_returns:
        cumulative *= (1 + r)
    avg_annual_return = (cumulative ** (1/term)) - 1

    print(f"  Monthly Payment:    ${monthly_payment:,.2f}")
    print(f"  Total Interest:     ${total_interest:,.2f}")
    print(f"  Avg Annual Return:  {avg_annual_return*100:.2f}%")
    print()
    print(f"  Scenario 1 (Pay Cash):")
    print(f"    Investment Growth:  ${s1_invest:,.2f}")
    print(f"    Total Value:        ${s1_total:,.2f}")
    print()
    print(f"  Scenario 2 (Mortgage):")
    print(f"    Investment Growth:  ${s2_invest:,.2f}")
    print(f"    Total Value:        ${s2_total:,.2f}")
    print()
    print(f"  Difference:         ${s2_total - s1_total:,.2f}")
    print(f"  Winner:             {'Scenario 2' if s2_total > s1_total else 'Scenario 1'}")
    print()

print("=" * 100)
print("MANUAL CALCULATION WALKTHROUGH (30 year, 7%, $500k)")
print("=" * 100)
print()
print("Monthly Payment Formula:")
print("  P = B * (r * (1+r)^n) / ((1+r)^n - 1)")
print("  where B = balance, r = monthly rate, n = number of payments")
print()
balance = 500000
rate_annual = 0.07
term_years = 30
rate_monthly = rate_annual / 12
num_payments = term_years * 12

print(f"  B = ${balance:,}")
print(f"  r = {rate_annual} / 12 = {rate_monthly:.10f}")
print(f"  n = {term_years} * 12 = {num_payments}")
print()
print(f"  (1+r)^n = (1 + {rate_monthly:.10f})^{num_payments}")
print(f"          = {(1 + rate_monthly)**num_payments:.10f}")
print()
monthly_payment = calculate_monthly_payment(balance, rate_annual, term_years)
print(f"  P = ${monthly_payment:.2f}")
print()
total_paid = monthly_payment * num_payments
total_interest = total_paid - balance
print(f"  Total Paid = ${monthly_payment:.2f} * {num_payments} = ${total_paid:,.2f}")
print(f"  Total Interest = ${total_paid:,.2f} - ${balance:,} = ${total_interest:,.2f}")
print()
