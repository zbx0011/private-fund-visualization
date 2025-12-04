"""
Fetch index data using AKShare
Outputs JSON to stdout for Node.js consumption
"""
import akshare as ak
import json
import sys
from datetime import datetime
import os

# Disable proxy
os.environ['NO_PROXY'] = '*'
os.environ['no_proxy'] = '*'
os.environ.pop('HTTP_PROXY', None)
os.environ.pop('HTTPS_PROXY', None)
os.environ.pop('http_proxy', None)
os.environ.pop('https_proxy', None)

def fetch_index_data_sina(symbol, start_date, end_date, exchange='sh'):
    """Fetch index daily data from Sina"""
    try:
        print(f"Trying stock_zh_index_daily for {exchange}{symbol}...", file=sys.stderr)
        df = ak.stock_zh_index_daily(symbol=f"{exchange}{symbol}")
        
        if df is None or df.empty:
            return []
        
        # Convert date column to string for comparison
        df['date_str'] = df['date'].astype(str)
        df = df[df['date_str'] >= start_date]
        df = df[df['date_str'] <= end_date]
        
        result = []
        for _, row in df.iterrows():
            result.append({
                "date": str(row["date"]),
                "close": float(row["close"]),
            })
        return result
    except Exception as e:
        print(f"Error with stock_zh_index_daily: {e}", file=sys.stderr)
        return []

def fetch_csi_2000(start_date, end_date):
    """Fetch CSI 2000 (中证2000) data using 国证2000 (399303)"""
    try:
        print(f"Trying stock_zh_index_daily for sz399303 (国证2000)...", file=sys.stderr)
        df = ak.stock_zh_index_daily(symbol="sz399303")
        
        if df is not None and not df.empty:
            df['date_str'] = df['date'].astype(str)
            df = df[df['date_str'] >= start_date]
            df = df[df['date_str'] <= end_date]
            
            result = []
            for _, row in df.iterrows():
                result.append({
                    "date": str(row["date"]),
                    "close": float(row["close"]),
                })
            return result
    except Exception as e:
        print(f"Error with 国证2000: {e}", file=sys.stderr)
    
    return []

def main():
    # Define indices to fetch
    # Using 中证800 (000906) for 量化选股 strategy as it covers 沪深300 + 中证500
    indices = [
        {"symbol": "000300", "name": "沪深300", "code": "000300.SH", "exchange": "sh"},
        {"symbol": "000905", "name": "中证500", "code": "000905.SH", "exchange": "sh"},
        {"symbol": "000852", "name": "中证1000", "code": "000852.SH", "exchange": "sh"},
        {"symbol": "000906", "name": "中证800", "code": "000906.SH", "exchange": "sh"},  # For 量化选股
    ]
    
    # Date range - fetch from 2020 for historical data
    start_date = "2020-01-01"
    end_date = datetime.now().strftime("%Y-%m-%d")
    
    all_data = {}
    
    # Fetch main indices
    for idx in indices:
        print(f"Fetching {idx['name']} ({idx['symbol']})...", file=sys.stderr)
        data = fetch_index_data_sina(idx['symbol'], start_date, end_date, idx['exchange'])
        if data:
            all_data[idx['code']] = {
                "name": idx['name'],
                "data": data
            }
            print(f"  Got {len(data)} records", file=sys.stderr)
        else:
            print(f"  No data for {idx['symbol']}", file=sys.stderr)
    
    # Fetch CSI 2000 separately (using 国证2000)
    print(f"Fetching 中证2000...", file=sys.stderr)
    csi2000_data = fetch_csi_2000(start_date, end_date)
    if csi2000_data:
        all_data["932000.CSI"] = {
            "name": "中证2000",
            "data": csi2000_data
        }
        print(f"  Got {len(csi2000_data)} records", file=sys.stderr)
    else:
        print(f"  No data for 中证2000", file=sys.stderr)
    
    # Output as JSON
    print(json.dumps(all_data, ensure_ascii=False))

if __name__ == "__main__":
    main()
