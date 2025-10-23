# How We Handle Negative Values

## The Problem

When Scenario 2 (Get Mortgage, Invest Lump Sum) encounters severe market crashes, the investment value can drop so low that:

```
Home Value + Investment Value - Interest Paid < 0
```

This happened historically during the Great Depression (1929 start) with high mortgage rates.

## What Really Happens in Real Life?

If your total value goes negative, you have three options:

### Option 1: Forced Liquidation
- Sell investments at market bottom to pay off mortgage
- Miss the recovery (no longer invested)
- End up with just your home, no investments
- **Worst outcome**

### Option 2: Pay from Other Income
- Keep making mortgage payments from salary/savings
- Try to hold onto investments
- Hope market recovers
- **Defeats the purpose of the "invest instead" strategy**

### Option 3: Default
- Can't make payments, can't cover shortfall
- Lose home to foreclosure
- **Catastrophic**

## How Our Calculator Handles This

We use **Option 2 (Mathematical Assumption)**:

### Current Calculation (Naive/Optimistic):
```
Total Value = Home + Investment Growth - Total Interest
```

This **assumes** you have other income to cover all mortgage payments even when the investment crashes.

### Why This Approach?

✅ **Simpler to understand** - One clear formula
✅ **Shows mathematical outcome** - Best case if you can hold on
✅ **Educational** - Demonstrates sequence of return risk
✅ **Comparable** - Can compare different periods fairly

❌ **Unrealistic in extremes** - Most people can't cover huge losses
❌ **Too optimistic** - Real outcome would likely be worse

## What We Added: Warnings

When calculations detect problems, we show **prominent warnings**:

### Critical Warning (Value Went Negative):
```
⚠️ CRITICAL WARNING: Scenario 2 Went NEGATIVE

Minimum value reached: -$156,272.79
Occurred: 1948-10 (Month 238)

What this means: The market crashed so severely that your
investment losses plus accumulated interest exceeded your home
value. In reality, you would likely be forced to:
- Liquidate investments at a loss to pay off the mortgage, OR
- Make mortgage payments from other income (defeating the strategy), OR
- Default on the mortgage (catastrophic)

This calculator shows the mathematical outcome assuming you can
continue making payments from other income. Real-world outcome
would likely be worse.
```

### Caution Warning (Severe Drawdown):
Shows when value drops below 50% during the period, indicating psychological stress risk.

## Example: Great Depression

### Scenario:
- $500k home, 10% mortgage rate, 30 years
- Start: September 1929
- Market crashes October 1929

### Month-by-Month:
```
Month 1:  Total = $971,393  (looking good!)
Month 10: Total = $781,029  (crash begins)
Month 238: Total = -$156,273 (negative!)
Month 360: Total = $360,138  (finally recovers)
```

### Mathematical Calculation:
Final value: **$360,138** (what calculator shows)

### Realistic Outcome:
If you held on through 19+ years of being underwater:
- **$360,138** (if you had infinite reserves and nerves of steel)

If you were forced to liquidate when it went negative:
- **$500,000** (just your home, no investments)
- Or **less** if you had to sell home too

## Our Recommendation

We show the **mathematical/optimistic** calculation but add **clear warnings** when:

1. ✅ Value goes negative during the period
2. ✅ Final value is negative
3. ✅ Severe drawdowns occur (>50% decline)

This approach:
- Shows what COULD happen if you have infinite reserves
- Warns clearly when outcomes would likely be worse
- Educates about sequence of return risk
- Maintains calculation simplicity

## Alternative Approaches Considered

### Approach A: Show Realistic (Forced Liquidation)
```python
if investment_value < principal_remaining:
    # Forced to liquidate
    principal_remaining -= investment_value
    investment_value = 0
    # Continue paying from income
```

❌ **Rejected because:**
- More complex to implement
- Harder to explain
- Still makes assumptions (when you'd liquidate)
- Less comparable across scenarios

### Approach B: Show Both Calculations
- Show optimistic AND pessimistic
- Let user decide which is realistic

❌ **Rejected because:**
- Cluttered UI
- Confusing for users
- Still need to make assumptions

### Approach C: Current (Mathematical + Warnings) ✅
- Show mathematical outcome
- Add prominent warnings when unrealistic
- Explain what would really happen

## For Users

**Bottom Line:**
- These calculations assume you have other income to cover all payments
- If the calculator shows negative values or severe warnings, the real outcome would likely be **worse**, not better
- This is why timing matters so much (sequence of return risk)
- This is why having other income sources matters
- This is why Scenario 1 (Pay Cash) might be safer despite lower returns

## Testing Negative Scenarios

To see warnings in action, try:
- Year: 1929, Rate: 10%, Term: 30 years
- Year: 2000, Rate: 8%, Term: 30 years (dot-com bubble)
- Year: 2007, Rate: 8%, Term: 15 years (financial crisis)

The calculator will show exactly when and how badly things went wrong.
