#!/usr/bin/env python3
"""Find winning scenarios with different mortgage rates."""

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
        return None
    
    num_months = years * 12
    if start_idx + num_months > len(all_dates):
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
    
    for month in range(num_months):
        s2_investment *= (1 + returns[month])
        s2_investment -= monthly_payment
        
        interest_payment = principal * monthly_rate
        total_interest += interest_payment
        principal -= (monthly_payment - interest_payment)
    
    s2_final = home_price + s2_investment - total_interest
    
    return {
        'rate': annual_rate,
        'years': years,
        'start': start_year,
        's1': s1_final,
        's2': s2_final,
        's2_inv': s2_investment,
        'diff': s2_final - s1_final,
        'payment': monthly_payment
    }

print("Testing different mortgage rates to find Scenario 2 winners...\n")

# Test with low rates (3-4%) during strong bull markets
test_configs = [
    (1982, 30, 0.03),  # 3% rate, mega bull market
    (1982, 30, 0.04),  # 4% rate, mega bull market
    (1990, 30, 0.03),  # 3% rate, 90s boom
    (1990, 30, 0.04),  # 4% rate, 90s boom
    (2009, 15, 0.03),  # 3% rate, post-crisis rally
]

winners = []

for start_year, years, rate in test_configs:
    result = test_scenario(500000, rate, years, start_year)
    if result:
        wins = result['diff'] > 0
        ran_out = result['s2_inv'] < 0
        
        print(f"Year {start_year}, {years}yr, {rate*100}% rate:")
        print(f"  Payment: ${result['payment']:,.2f}/month")
        print(f"  S1: ${result['s1']:,.2f}")
        print(f"  S2: ${result['s2']:,.2f}")
        print(f"  Diff: ${result['diff']:,.2f} - {'S2 WINS! 🎉' if wins else 'S1 wins'}")
        if ran_out:
            print(f"  ⚠️  RAN OUT OF MONEY")
        print()
        
        if wins and not ran_out:
            winners.append(result)

if winners:
    best = max(winners, key=lambda x: x['diff'])
    print("=" * 80)
    print("BEST SCENARIO 2 WIN FOUND:")
    print("=" * 80)
    print(f"\nHome Price: $500,000")
    print(f"Mortgage Rate: {best['rate']*100}%")
    print(f"Term: {best['years']} years")
    print(f"Starting Year: {best['start']}")
    print(f"\nMonthly Payment: ${best['payment']:,.2f}")
    print(f"\nResults:")
    print(f"  Scenario 1: ${best['s1']:,.2f}")
    print(f"  Scenario 2: ${best['s2']:,.2f}")
    print(f"  Scenario 2 wins by: ${best['diff']:,.2f}")
else:
    print("No winners found even with low rates. Let me try even lower...")
    
    # Try super low rates
    for rate in [0.02, 0.025]:
        result = test_scenario(500000, rate, 30, 1990)
        if result and result['diff'] > 0 and result['s2_inv'] > 0:
            print(f"\n✓ FOUND WINNER with {rate*100}% rate!")
            print(f"  S2 wins by: ${result['diff']:,.2f}")
            winners.append(result)

if winners:
    best = max(winners, key=lambda x: x['diff'])
    print("\n" + "=" * 80)
    print("RECOMMENDED TEST FOR SCENARIO 2 WIN:")
    print("=" * 80)
    print(f"\nHome Price: $500,000")
    print(f"Mortgage Rate: {best['rate']*100}%")
    print(f"Term: {best['years']} years") 
    print(f"Starting Year: {best['start']}")
