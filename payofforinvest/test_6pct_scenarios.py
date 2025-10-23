#!/usr/bin/env python3
"""Test 6% rate for 15 years starting in 1991 and 2001."""

import json

with open('sp500_monthly_returns.json', 'r') as f:
    sp500_data = json.load(f)

all_dates = sorted(sp500_data.keys())

def calculate_monthly_payment(balance, annual_rate, years):
    monthly_rate = annual_rate / 12
    num_months = years * 12
    if monthly_rate == 0:
        return balance / num_months
    r = monthly_rate
    n = num_months
    one_plus_r_to_n = (1 + r) ** n
    return balance * (r * one_plus_r_to_n) / (one_plus_r_to_n - 1)

def test_scenario(home_price, annual_rate, years, start_year):
    """Test both scenarios."""
    start_date = f'{start_year}-02'
    
    try:
        start_idx = all_dates.index(start_date)
    except ValueError:
        print(f"Error: No data for {start_date}")
        return None
    
    num_months = years * 12
    if start_idx + num_months > len(all_dates):
        print(f"Error: Not enough data")
        return None
    
    returns = [sp500_data[all_dates[start_idx + i]] for i in range(num_months)]
    monthly_payment = calculate_monthly_payment(home_price, annual_rate, years)
    
    # Scenario 1: Pay cash, invest monthly
    s1_investment = 0.0
    for month in range(num_months):
        s1_investment += monthly_payment
        s1_investment *= (1 + returns[month])
    s1_final = home_price + s1_investment
    
    # Scenario 2: Mortgage, invest lump sum, withdraw
    s2_investment = home_price
    total_interest = 0.0
    monthly_rate = annual_rate / 12
    principal = home_price
    ran_out_month = None
    
    for month in range(num_months):
        s2_investment *= (1 + returns[month])
        s2_investment -= monthly_payment
        
        if s2_investment < 0 and ran_out_month is None:
            ran_out_month = month + 1
        
        interest_payment = principal * monthly_rate
        total_interest += interest_payment
        principal -= (monthly_payment - interest_payment)
    
    s2_final = home_price + s2_investment - total_interest
    
    return {
        'start_year': start_year,
        'years': years,
        'rate': annual_rate,
        'payment': monthly_payment,
        's1': s1_final,
        's2': s2_final,
        's2_inv': s2_investment,
        'diff': s2_final - s1_final,
        'ran_out': ran_out_month,
        'total_interest': total_interest
    }

print("=" * 80)
print("TESTING 6% RATE, 15 YEARS")
print("=" * 80)
print()

# Test 1991
print("TEST 1: Starting 1991")
print("-" * 80)
result1 = test_scenario(500000, 0.06, 15, 1991)
if result1:
    print(f"Monthly payment: ${result1['payment']:,.2f}")
    print(f"Total interest paid: ${result1['total_interest']:,.2f}")
    print()
    print(f"Scenario 1 (Pay Cash):  ${result1['s1']:,.2f}")
    print(f"Scenario 2 (Mortgage):  ${result1['s2']:,.2f}")
    print(f"  S2 Investment value:  ${result1['s2_inv']:,.2f}")
    print()
    if result1['ran_out']:
        print(f"💀 RAN OUT OF MONEY at month {result1['ran_out']}")
    elif result1['diff'] > 0:
        print(f"✓ Scenario 2 WINS by ${result1['diff']:,.2f}")
    else:
        print(f"✓ Scenario 1 WINS by ${abs(result1['diff']):,.2f}")
    print()

print()

# Test 2001
print("TEST 2: Starting 2001")
print("-" * 80)
result2 = test_scenario(500000, 0.06, 15, 2001)
if result2:
    print(f"Monthly payment: ${result2['payment']:,.2f}")
    print(f"Total interest paid: ${result2['total_interest']:,.2f}")
    print()
    print(f"Scenario 1 (Pay Cash):  ${result2['s1']:,.2f}")
    print(f"Scenario 2 (Mortgage):  ${result2['s2']:,.2f}")
    print(f"  S2 Investment value:  ${result2['s2_inv']:,.2f}")
    print()
    if result2['ran_out']:
        print(f"💀 RAN OUT OF MONEY at month {result2['ran_out']}")
    elif result2['diff'] > 0:
        print(f"✓ Scenario 2 WINS by ${result2['diff']:,.2f}")
    else:
        print(f"✓ Scenario 1 WINS by ${abs(result2['diff']):,.2f}")
    print()

print()
print("=" * 80)
print("SUMMARY")
print("=" * 80)
print()

if result1 and result2:
    print("1991 Start (through 2006):")
    print(f"  - Includes: Dot-com boom (late 90s) then bust (2000-2002)")
    if result1['ran_out']:
        print(f"  - Result: CATASTROPHIC - ran out of money")
    elif result1['diff'] > 0:
        print(f"  - Result: Scenario 2 wins by ${result1['diff']:,.2f}")
    else:
        print(f"  - Result: Scenario 1 wins by ${abs(result1['diff']):,.2f}")
    print()
    
    print("2001 Start (through 2016):")
    print(f"  - Includes: Dot-com crash (2001-2002), then 2008 financial crisis")
    if result2['ran_out']:
        print(f"  - Result: CATASTROPHIC - ran out of money at month {result2['ran_out']}")
    elif result2['diff'] > 0:
        print(f"  - Result: Scenario 2 wins by ${result2['diff']:,.2f}")
    else:
        print(f"  - Result: Scenario 1 wins by ${abs(result2['diff']):,.2f}")
