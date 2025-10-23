# Major Update: Scenario 2 Now Uses Withdrawal Model

## What Changed

We fundamentally changed how Scenario 2 (Get Mortgage) is calculated.

### OLD Model (Incorrect):
- Invest $500k lump sum
- Let it compound for entire period
- **Did NOT withdraw** mortgage payments from investment
- Assumed you pay mortgage from other income (job salary)
- Problem: This isn't a fair comparison - you're using external income that Scenario 1 doesn't account for

### NEW Model (Correct):
- Invest $500k lump sum
- **Each month:** Apply market return, THEN withdraw mortgage payment
- Investment CAN go to $0 (or negative) if market crashes + withdrawals deplete it
- Fair comparison: Both scenarios use the same $500k, no external income

## Why This Matters

### The Catastrophic Risk

With the withdrawal model, **Scenario 2 can FAIL COMPLETELY**:

1. **What happens:** Market crashes hard early on
2. **Investment depletes:** Withdrawals + losses = $0 balance
3. **Cannot make payments:** You literally run out of money
4. **Foreclosure:** Bank takes the house
5. **Total loss:** You lose EVERYTHING

### Real Example: Great Depression

Test parameters:
- Home price: $500,000
- Mortgage rate: 7%
- Term: 30 years
- Start: 1929 (Great Depression)

**Results:**
```
Month 66 (June 1934): Investment DEPLETED
- Time until failure: 5.5 years
- Remaining mortgage: 24.5 years (294 payments)
- Final deficit: -$3,455,318
- Real outcome: FORECLOSURE
```

## Warning Levels

The calculator now has 4 warning levels:

### 1. CATASTROPHIC (💀 Red background, white text)
**Trigger:** Investment goes below $0
**Meaning:** RAN OUT OF MONEY - Cannot make mortgage payments
**Outcome:** Forced default, foreclosure, total loss

### 2. CRITICAL (🚨 Red border)
**Trigger:** Investment < Principal Remaining
**Meaning:** Can't pay off mortgage even if you liquidate
**Outcome:** You're trapped, must continue payments or lose house

### 3. WARNING (⚠️ Red border)
**Trigger:** Total value goes negative
**Meaning:** Negative net worth if you liquidate everything

### 4. CAUTION (⚠️ Yellow border)
**Trigger:** Severe drawdown (>50% loss from peak)
**Meaning:** Extreme psychological stress, high risk

## Code Changes

### File: app.js

**Function: `scenarioInvest()`**
```javascript
// OLD (Wrong):
for (let month = 0; month < numMonths; month++) {
    let investmentValue = balance;
    for (let j = 0; j <= month; j++) {
        investmentValue *= (1 + monthlyReturns[j]);
    }
    // No withdrawal!
}

// NEW (Correct):
let investmentValue = balance;
for (let month = 0; month < numMonths; month++) {
    // Apply market return
    investmentValue *= (1 + monthlyReturns[month]);

    // Withdraw mortgage payment
    investmentValue -= monthlyPayment;

    // Track if depleted
    if (investmentValue < 0 && !ranOutOfMoney) {
        ranOutOfMoney = true;
        ranOutMonth = month + 1;
    }
}
```

**New tracking:**
- `ranOutOfMoney`: Boolean - did investment go negative?
- `ranOutMonth`: When did it happen?
- `ranOutOfMoney` flag in monthly data

### File: index.html

Updated "About This Calculator" to explain:
- Scenario 2 withdraws payments from investment
- Can run out of money and face foreclosure
- No external income sources assumed

## Testing

Created `test_withdrawals.py` to verify:
- ✅ Great Depression (1929) depletes at month 66
- ✅ Final deficit calculated correctly
- ✅ JavaScript matches Python logic

## Educational Value

This change makes the calculator **much more realistic and educational**:

1. **Shows real risk:** Scenario 2 isn't just "less profitable" - it can FAIL
2. **Fair comparison:** Both scenarios use same $500k
3. **Demonstrates sequence risk:** Early crashes are catastrophic
4. **Real-world consequences:** Foreclosure, not just lower returns

## Migration Note

**This is a breaking change from the original Python program.**

The original `buyhouse.py` did NOT withdraw payments. We deliberately changed this to make a more realistic and fair comparison.

If you want to revert to the old model (no withdrawals), you would need to:
1. Remove the `investmentValue -= monthlyPayment` line
2. Remove the `ranOutOfMoney` tracking
3. Update warnings

But we **strongly recommend keeping the new model** because it's more realistic and educational.

## User Impact

Users will now see:
- **More dramatic warnings** for bad timing (Great Depression, 2000 bubble, 2008 crisis)
- **Catastrophic failures** in worst-case scenarios
- **Clearer understanding** of why Scenario 1 is safer
- **Better appreciation** of sequence of return risk

The calculator is now **much more powerful** as an educational tool!
