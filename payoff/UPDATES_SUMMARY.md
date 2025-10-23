# Updates Summary: Negative Value Handling

## What We Added

### 1. Detection of Negative Values
- Always calculate month-by-month for Scenario 2 (even if not displaying)
- Track minimum value reached and when
- Flag if values ever went negative during the period

### 2. Critical Warning Display
When Scenario 2 goes negative, shows prominent red warning:

```
⚠️ CRITICAL WARNING: Scenario 2 Went NEGATIVE

Minimum value reached: -$156,272.79
Occurred: 1948-10 (Month 238)

What this means: The market crashed so severely that your investment
losses plus accumulated interest exceeded your home value. In reality,
you would likely be forced to:
- Liquidate investments at a loss to pay off the mortgage, OR
- Make mortgage payments from other income (defeating the strategy), OR
- Default on the mortgage (catastrophic)

This calculator shows the mathematical outcome assuming you can continue
making payments from other income. Real-world outcome would likely be worse.

👉 Click "Show Monthly Progress" to see the chart and table showing exactly
when and how the crash happened month-by-month.
```

### 3. Enhanced Chart Visualization
- **Red line** for Scenario 2 when negatives exist
- **Thick red zero line** to clearly show where values cross negative
- **Color-coded segments** (red below zero, orange/green above)

### 4. Enhanced Table Display
- **Red background** on rows where Scenario 2 is negative
- **Bold red text** for negative total values
- **Warning emoji (⚠️)** in the "Better" column
- **Red left border** to highlight critical rows

### 5. Additional Warning Levels

**Level 1 - Caution (Severe Drawdown):**
Yellow warning when value drops >50% during period

**Level 2 - Warning (Negative Final Value):**
Red warning when final value is negative

**Level 3 - Critical (Went Negative):**
Bright red critical warning when value went negative at any point

## How It Works

### Code Flow:
```javascript
1. Calculate Scenario 2 with monthly tracking (always)
2. Loop through all months to find:
   - Minimum value reached
   - Month when minimum occurred
   - Whether any value was negative
3. Display appropriate warning level
4. If user clicks "Show Monthly Progress":
   - Chart shows red line below zero
   - Table highlights negative rows in red
```

### Visual Indicators:
- 🟢 Green = Scenario 2 winning, no issues
- 🟡 Yellow = Caution, severe drawdown
- 🔴 Red = Critical, went negative

## Test Cases to Try

### 1. Great Depression (Goes Negative):
```
Home Price: $500,000
Rate: 10%
Term: 30 years
Year: 1929
```
**Expected:** Critical warning, chart and table show negative values

### 2. Dot-com Bubble (Severe Drawdown):
```
Home Price: $500,000
Rate: 7%
Term: 30 years
Year: 2000
```
**Expected:** Caution/warning about drawdown

### 3. Financial Crisis (Severe Drawdown):
```
Home Price: $500,000
Rate: 7%
Term: 15 years
Year: 2007
```
**Expected:** Caution/warning about drawdown

### 4. Good Period (No Warning):
```
Home Price: $500,000
Rate: 7%
Term: 30 years
Year: 1990
```
**Expected:** No warnings, green chart

## Files Modified

1. **app.js**
   - Added negative value detection
   - Added warning HTML generation
   - Enhanced chart with color coding
   - Enhanced table with red highlighting

2. **NEGATIVE_VALUES_EXPLAINED.md** (new)
   - Complete explanation of the issue
   - Why we chose our approach
   - What alternatives were considered

3. **check_negative_values.py** (new)
   - Script to find worst historical periods
   - Tests different configurations
   - Shows when/where negatives occur

4. **model_forced_liquidation.py** (new)
   - Models realistic behavior
   - Compares naive vs realistic outcomes
   - Shows impact of forced selling

## Philosophy

We chose **transparency over complexity**:
- Show mathematical outcome (assumes infinite patience/resources)
- Warn clearly when this is unrealistic
- Explain what would really happen
- Let users understand the full risk picture

This is more educational than showing a "realistic" calculation that makes its own assumptions about when you'd liquidate.

## User Benefit

Users now can:
1. See exactly when disaster would strike
2. Understand the real consequences
3. Make informed decisions about timing risk
4. Appreciate why Scenario 1 might be safer
5. Learn about sequence of return risk visually
