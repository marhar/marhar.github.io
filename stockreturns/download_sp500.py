#!/usr/bin/env python3
"""Download historical S&P 500 data and save as JSON for web app."""

import yfinance as yf
import json
import numpy as np

print('Downloading S&P 500 data from 1928...')
sp500 = yf.download('^GSPC', start='1928-01-01', progress=False, auto_adjust=True)

# Get Close prices
if 'Close' in sp500.columns:
    prices = sp500['Close']
else:
    prices = sp500['Close'].squeeze()

# Resample to monthly and calculate returns
monthly_prices = prices.resample('ME').last()
monthly_returns = monthly_prices.pct_change().dropna()

# Convert to dictionary with date as key and return as value
data = {}
for idx in range(len(monthly_returns)):
    date = monthly_returns.index[idx]
    ret = monthly_returns.iloc[idx]
    date_str = str(date)[:7]  # Get YYYY-MM format

    # Convert numpy/pandas types to Python float
    if isinstance(ret, (np.ndarray, np.generic)):
        ret_value = float(ret)
    else:
        ret_value = float(ret)

    data[date_str] = ret_value

# Save to JSON file
with open('sp500_monthly_returns.json', 'w') as f:
    json.dump(data, f, indent=2)

# Save as JavaScript module
with open('sp500_data.js', 'w') as f:
    f.write('// Historical S&P 500 Monthly Returns\n')
    f.write(f'// Data from {list(data.keys())[0]} to {list(data.keys())[-1]}\n')
    f.write('// Source: Yahoo Finance (^GSPC)\n\n')
    f.write('const SP500_MONTHLY_RETURNS = ')
    f.write(json.dumps(data, indent=2))
    f.write(';\n')

print(f'Downloaded {len(data)} months of data')
print(f'Date range: {list(data.keys())[0]} to {list(data.keys())[-1]}')
print('Saved to sp500_monthly_returns.json and sp500_data.js')

# Show some sample data
print('\nSample data (first 5 months):')
for i, (date, ret) in enumerate(list(data.items())[:5]):
    print(f'  {date}: {ret:.6f} ({ret*100:.2f}%)')
