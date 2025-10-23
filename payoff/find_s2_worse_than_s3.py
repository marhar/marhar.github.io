#!/usr/bin/env python3
"""Find scenarios where Scenario 2 is worse than Scenario 3 (just owning the home)."""

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

def test_scenario(home_price, annual_rate, years, start_year):
    """Test all three scenarios."""
    start_date = f'{start_year}-02'
    
    try:
        start_idx = all_dates.index(start_date)
    except ValueError:
        return None
    
    num_months = years * 12
    if start_idx + num_months > len(all_dates):
        return None
    
    returns = [sp500_data[all_dates[start_idx + i]] for i in range(num_months)]
    monthly_payment = calculate_monthly_payment(home_price, annual_rate, years)
    
    # Scenario 3: Just own the home
    s3_value = home_price
    
    # Scenario 2: Mortgage + invest
    s2_investment = home_price
    total_interest = 0
    monthly_rate = annual_rate / 12
    principal = home_price
    
    for month in range(num_months):
        s2_investment *= (1 + returns[month])
        s2_investment -= monthly_payment
        
        interest_payment = principal * monthly_rate
        total_interest += interest_payment
        principal -= (monthly_payment - interest_payment)
    
    s2_value = home_price + s2_investment - total_interest
    
    return {
        'start_year': start_year,
        'years': years,
        'rate': annual_rate,
        's2_value': s2_value,
        's3_value': s3_value,
        'difference': s2_value - s3_value,
        's2_investment': s2_investment,
        'total_interest': total_interest
    }

print("=" * 80)
print("FINDING SCENARIOS WHERE S2 < S3")
print("(Where getting a mortgage + investing is WORSE than just owning the home)")
print("=" * 80)
print()

# Test various doom scenarios
test_configs = [
    # High rates + bad markets
    (1929, 30, 0.10),  # Great Depression, 10%
    (1929, 30, 0.08),  # Great Depression, 8%
    (2000, 15, 0.08),  # Dot-com crash, 8%
    (2000, 15, 0.10),  # Dot-com crash, 10%
    (2001, 15, 0.06),  # We know this one runs out
    (2001, 15, 0.08),  # Even worse
    (2007, 15, 0.08),  # Financial crisis
    (1973, 15, 0.10),  # 70s stagflation
]

doom_scenarios = []

for start_year, years, rate in test_configs:
    result = test_scenario(500000, rate, years, start_year)
    if result:
        is_doom = result['s2_value'] < result['s3_value']
        
        print(f"Start: {start_year}, {years}yr, {rate*100}% rate")
        print(f"  S2 value: ${result['s2_value']:,.0f}")
        print(f"  S3 value: ${result['s3_value']:,.0f}")
        print(f"  Difference: ${result['difference']:,.0f}")
        print(f"  Result: {'💀 DOOM! S2 < S3' if is_doom else 'S2 still better'}")
        print()
        
        if is_doom:
            doom_scenarios.append(result)

print("=" * 80)
print("DOOM SCENARIOS FOUND")
print("=" * 80)
print()

if doom_scenarios:
    # Sort by worst outcome
    doom_scenarios.sort(key=lambda x: x['difference'])
    
    print(f"Found {len(doom_scenarios)} scenarios where S2 < S3\n")
    
    for i, d in enumerate(doom_scenarios, 1):
        print(f"{i}. Year {d['start_year']}, {d['years']}-year, {d['rate']*100}% rate")
        print(f"   S2 worse by: ${abs(d['difference']):,.0f}")
        print(f"   S2 final: ${d['s2_value']:,.0f}")
        print()
    
    worst = doom_scenarios[0]
    print("=" * 80)
    print("WORST CASE FOUND (S2 most below S3)")
    print("=" * 80)
    print()
    print(f"Home Price: $500,000")
    print(f"Mortgage Rate: {worst['rate']*100}%")
    print(f"Term: {worst['years']} years")
    print(f"Starting Year: {worst['start_year']}")
    print()
    print(f"Results:")
    print(f"  Scenario 2: ${worst['s2_value']:,.2f}")
    print(f"  Scenario 3: ${worst['s3_value']:,.2f}")
    print(f"  S2 worse by: ${abs(worst['difference']):,.2f}")
    print()
    print(f"Details:")
    print(f"  Final investment: ${worst['s2_investment']:,.2f}")
    print(f"  Interest paid: ${worst['total_interest']:,.2f}")
    print()
    print("Interpretation:")
    print("  You would have been better off just paying cash and doing NOTHING")
    print("  than trying to leverage with a mortgage and invest!")
else:
    print("No doom scenarios found in the tested configurations.")
    print("Even in bad markets, S2 never fell below S3 (just owning the home).")
