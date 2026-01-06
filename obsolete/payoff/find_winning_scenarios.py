#!/usr/bin/env python3
"""Find historical periods where Scenario 2 (mortgage) beats Scenario 1 (pay cash)."""

import json

# Load S&P 500 data
with open('sp500_monthly_returns.json', 'r') as f:
    sp500_data = json.load(f)

all_dates = sorted(sp500_data.keys())

def calculate_monthly_payment(balance, annual_rate, years):
    """Calculate monthly mortgage payment."""
    monthly_rate = annual_rate / 12
    num_months = years * 12
    if monthly_rate == 0:
        return balance / num_months
    r = monthly_rate
    n = num_months
    one_plus_r_to_n = (1 + r) ** n
    return balance * (r * one_plus_r_to_n) / (one_plus_r_to_n - 1)

def scenario_pay_cash(home_price, monthly_payment, returns):
    """Scenario 1: Pay cash, invest monthly payments."""
    num_months = len(returns)
    investment_value = 0.0
    
    for month in range(num_months):
        # Add this month's payment
        investment_value += monthly_payment
        # Apply market return
        investment_value *= (1 + returns[month])
    
    # Total: home + investment
    return home_price + investment_value

def scenario_mortgage(home_price, monthly_payment, returns):
    """Scenario 2: Mortgage, invest lump sum, withdraw payments."""
    num_months = len(returns)
    investment_value = home_price
    total_interest = 0.0
    
    annual_rate = 0.07  # We'll use 7% for all tests
    monthly_rate = annual_rate / 12
    principal_remaining = home_price
    
    for month in range(num_months):
        # Apply market return
        investment_value *= (1 + returns[month])
        
        # Withdraw mortgage payment
        investment_value -= monthly_payment
        
        # Track interest paid
        interest_payment = principal_remaining * monthly_rate
        principal_payment = monthly_payment - interest_payment
        total_interest += interest_payment
        principal_remaining -= principal_payment
    
    # Total: home + investment - interest paid
    return home_price + investment_value - total_interest, investment_value

def test_period(start_year, years, home_price=500000, rate=0.07):
    """Test a specific period."""
    start_date = f'{start_year}-02'  # February (matches our data)
    
    try:
        start_idx = all_dates.index(start_date)
    except ValueError:
        return None
    
    num_months = years * 12
    if start_idx + num_months > len(all_dates):
        return None
    
    returns = [sp500_data[all_dates[start_idx + i]] for i in range(num_months)]
    monthly_payment = calculate_monthly_payment(home_price, rate, years)
    
    s1_final = scenario_pay_cash(home_price, monthly_payment, returns)
    s2_final, s2_investment = scenario_mortgage(home_price, monthly_payment, returns)
    
    difference = s2_final - s1_final
    
    return {
        'start_year': start_year,
        'years': years,
        's1_final': s1_final,
        's2_final': s2_final,
        's2_investment': s2_investment,
        'difference': difference,
        's2_wins': difference > 0,
        'ran_out': s2_investment < 0
    }

print("=" * 100)
print("FINDING PERIODS WHERE SCENARIO 2 (MORTGAGE) WINS")
print("=" * 100)
print()

# Test various periods
test_periods = [
    (1980, 30),  # Reagan bull market
    (1982, 30),  # Start of mega bull
    (1990, 30),  # 90s boom
    (1995, 30),  # Dot-com boom
    (1975, 30),  # 70s-80s
    (1985, 15),  # Shorter term, strong market
    (1990, 15),  # 90s boom, 15 year
    (2009, 15),  # Post-2008 recovery
]

winners = []

for start_year, years in test_periods:
    result = test_period(start_year, years)
    if result:
        print(f"Start: {result['start_year']}, Term: {result['years']} years")
        print(f"  Scenario 1 (Pay Cash):  ${result['s1_final']:>15,.2f}")
        print(f"  Scenario 2 (Mortgage):  ${result['s2_final']:>15,.2f}")
        print(f"  S2 Investment:          ${result['s2_investment']:>15,.2f}")
        print(f"  Difference:             ${result['difference']:>15,.2f}")
        print(f"  Winner: {'SCENARIO 2 🎉' if result['s2_wins'] else 'Scenario 1'}")
        if result['ran_out']:
            print(f"  WARNING: RAN OUT OF MONEY!")
        print()
        
        if result['s2_wins'] and not result['ran_out']:
            winners.append(result)

print("=" * 100)
print("BEST SCENARIOS FOR SCENARIO 2 (MORTGAGE)")
print("=" * 100)
print()

if winners:
    # Sort by biggest advantage
    winners.sort(key=lambda x: x['difference'], reverse=True)
    
    print(f"Found {len(winners)} periods where Scenario 2 wins!\n")
    
    for i, w in enumerate(winners[:5], 1):
        print(f"{i}. Year {w['start_year']}, {w['years']}-year term")
        print(f"   Advantage: ${w['difference']:,.2f}")
        print(f"   S2 Total: ${w['s2_final']:,.2f}")
        print()
    
    best = winners[0]
    print("=" * 100)
    print("RECOMMENDED TEST CASE")
    print("=" * 100)
    print()
    print(f"Home Price: $500,000")
    print(f"Mortgage Rate: 7%")
    print(f"Term: {best['years']} years")
    print(f"Starting Year: {best['start_year']}")
    print()
    print(f"Expected Results:")
    print(f"  Scenario 1: ${best['s1_final']:,.2f}")
    print(f"  Scenario 2: ${best['s2_final']:,.2f}")
    print(f"  Scenario 2 wins by: ${best['difference']:,.2f}")
else:
    print("No winning scenarios found in tested periods!")
    print("Scenario 1 (pay cash) wins in all tested cases.")
