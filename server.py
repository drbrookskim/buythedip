import http.server
import socketserver
import urllib.parse
import json
import math
import re
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

PORT = 8080

# Load Master Stock Database (2,800+ KOSPI, KOSDAQ, KONEX & Global Stocks)
STOCK_DATABASE = []
try:
    with open('krx_stocks.json', 'r', encoding='utf-8') as f:
        STOCK_DATABASE = json.load(f)
        print(f"[Database] Successfully loaded {len(STOCK_DATABASE)} stocks from krx_stocks.json")
except Exception as e:
    print(f"[Database] Warning: Could not load krx_stocks.json ({e}), using fallback list")
    STOCK_DATABASE = [
        {"code": "005930", "ticker": "005930.KS", "name": "삼성전자", "market": "KOSPI", "category": "반도체/전자"},
        {"code": "000660", "ticker": "000660.KS", "name": "SK하이닉스", "market": "KOSPI", "category": "반도체"},
        {"code": "196170", "ticker": "196170.KQ", "name": "알테오젠", "market": "KOSDAQ", "category": "바이오"},
        {"code": "189330", "ticker": "189330.KQ", "name": "씨이랩", "market": "KOSDAQ", "category": "AI/소프트웨어"}
    ]

# Index dictionary for O(1) code lookup
STOCK_BY_CODE = {item['code']: item for item in STOCK_DATABASE}
STOCK_BY_NAME = {item['name'].lower(): item for item in STOCK_DATABASE}

def fetch_korean_stock_naver(code, count=250):
    try:
        import urllib.request
        import xml.etree.ElementTree as ET
        url = f"https://fchart.stock.naver.com/sise.nhn?symbol={code}&timeframe=day&count={count}&requestType=0"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'})
        with urllib.request.urlopen(req, timeout=4) as res:
            xml_data = res.read().decode('euc-kr', errors='ignore')
        root = ET.fromstring(xml_data)
        items = root.findall('.//item')
        data = []
        for it in items:
            parts = it.get('data', '').split('|')
            if len(parts) >= 6:
                dt = f"{parts[0][:4]}-{parts[0][4:6]}-{parts[0][6:8]}"
                o = float(parts[1])
                h = float(parts[2])
                l = float(parts[3])
                c = float(parts[4])
                v = int(parts[5])
                if o > 0 and h > 0 and l > 0 and c > 0:
                    data.append({
                        'date': dt,
                        'open': round(o, 2),
                        'high': round(h, 2),
                        'low': round(l, 2),
                        'close': round(c, 2),
                        'volume': v
                    })
        return data if len(data) > 0 else None
    except Exception as e:
        print(f"[Naver Finance Fetch] Notice: {e}")
        return None

class StockSimHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Properly unquote and decode UTF-8 URL paths and queries
        try:
            raw_path = urllib.parse.unquote_to_bytes(self.path).decode('utf-8', errors='replace')
        except Exception:
            raw_path = self.path
        parsed_url = urllib.parse.urlparse(raw_path)
        
        # API endpoint: /api/search
        if parsed_url.path == '/api/search':
            query_params = urllib.parse.parse_qs(parsed_url.query, encoding='utf-8')
            q = query_params.get('q', [''])[0].strip().lower()

            results = []
            if not q:
                # Default top popular stocks
                default_codes = ["005930", "000660", "196170", "005380", "189330", "247540", "068270", "035420", "NVDA", "AAPL", "TSLA"]
                for c in default_codes:
                    if c in STOCK_BY_CODE:
                        results.append(STOCK_BY_CODE[c])
                if len(results) < 15:
                    results = STOCK_DATABASE[:15]
            else:
                scored_results = []
                for item in STOCK_DATABASE:
                    name_l = item['name'].lower()
                    code_l = item['code'].lower()
                    cat_l = item.get('category', '').lower()
                    mkt_l = item.get('market', '').lower()
                    
                    score = 0
                    if name_l == q or code_l == q:
                        score += 100
                    elif name_l.startswith(q) or code_l.startswith(q):
                        score += 80
                    elif q in name_l:
                        score += 50
                    elif q in code_l:
                        score += 40
                    elif q in cat_l or q in mkt_l:
                        score += 20
                        
                    if score > 0:
                        scored_results.append((score, item))
                
                # Sort by score descending, then alphabetical
                scored_results.sort(key=lambda x: (-x[0], len(x[1]['name'])))
                results = [item for _, item in scored_results[:25]]
                
                # If numeric 6-digit code and not found in database, add fallback
                if len(results) == 0 and q.isdigit() and len(q) == 6:
                    results.append({
                        "code": q,
                        "ticker": f"{q}.KS",
                        "name": f"한국주식 ({q})",
                        "market": "KOSPI/KOSDAQ",
                        "category": "직접 입력"
                    })
                elif len(results) == 0 and len(q) >= 2:
                    results.append({
                        "code": q.upper(),
                        "ticker": q.upper(),
                        "name": f"해외주식 ({q.upper()})",
                        "market": "US/해외",
                        "category": "직접 입력"
                    })

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'results': results}, ensure_ascii=False).encode('utf-8'))
            return

        # API endpoint: /api/stock
        if parsed_url.path == '/api/stock':
            query_params = urllib.parse.parse_qs(parsed_url.query)
            symbol_raw = query_params.get('symbol', ['005930'])[0].strip()
            period_days = int(query_params.get('days', ['500'])[0])

            # Extract 6-digit numeric code if symbol_raw is like "삼성전자 (005930)" or "씨이랩 (189330)"
            code_match = re.search(r'\b\d{6}\b', symbol_raw)
            resolved_ticker = None
            stock_name = symbol_raw

            if code_match:
                code_found = code_match.group(0)
                if code_found in STOCK_BY_CODE:
                    resolved_ticker = STOCK_BY_CODE[code_found]['ticker']
                    stock_name = STOCK_BY_CODE[code_found]['name']
                symbol_raw = code_found
            else:
                # Try finding in database by code or exact name
                if symbol_raw in STOCK_BY_CODE:
                    resolved_ticker = STOCK_BY_CODE[symbol_raw]['ticker']
                    stock_name = STOCK_BY_CODE[symbol_raw]['name']
                elif symbol_raw.lower() in STOCK_BY_NAME:
                    resolved_ticker = STOCK_BY_NAME[symbol_raw.lower()]['ticker']
                    stock_name = STOCK_BY_NAME[symbol_raw.lower()]['name']
                else:
                    # Substring match by name
                    db_item = next((item for item in STOCK_DATABASE if symbol_raw.lower() in item['name'].lower()), None)
                    if db_item:
                        resolved_ticker = db_item['ticker']
                        stock_name = db_item['name']
                        symbol_raw = db_item['code']
                    else:
                        symbol_raw = symbol_raw.upper()

            # Determine primary ticker symbol to fetch
            if resolved_ticker:
                symbol = resolved_ticker
            elif symbol_raw.isdigit() and len(symbol_raw) == 6:
                symbol = f"{symbol_raw}.KS"
            else:
                symbol = symbol_raw

            # 1. Try fast real-time Korean market data (Naver Finance) for 6-digit KRX symbols
            if symbol_raw.isdigit() and len(symbol_raw) == 6:
                korean_data = fetch_korean_stock_naver(symbol_raw, period_days)
                if korean_data and len(korean_data) > 0:
                    db_item = next((item for item in STOCK_DATABASE if item['code'] == symbol_raw), None)
                    stock_name = db_item['name'] if db_item else symbol_raw
                    ticker_name = db_item['ticker'] if db_item else f"{symbol_raw}.KS"
                    
                    response_payload = {
                        'symbol': symbol_raw,
                        'ticker': ticker_name,
                        'name': stock_name,
                        'count': len(korean_data),
                        'data': korean_data
                    }
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps(response_payload, ensure_ascii=False, allow_nan=False).encode('utf-8'))
                    return

            try:
                # 2. Fallback or Global Stock real historical data via yfinance
                ticker = yf.Ticker(symbol)
                fetch_days = int(period_days * 1.5) + 30
                end_date = datetime.now()
                start_date = end_date - timedelta(days=fetch_days)

                df = ticker.history(start=start_date.strftime('%Y-%m-%d'), end=end_date.strftime('%Y-%m-%d'))
                
                if df.empty and symbol_raw.isdigit() and len(symbol_raw) == 6:
                    # Try alternative Korean exchange (.KQ <-> .KS)
                    alt_symbol = f"{symbol_raw}.KQ" if symbol.endswith('.KS') else f"{symbol_raw}.KS"
                    df = yf.Ticker(alt_symbol).history(start=start_date.strftime('%Y-%m-%d'), end=end_date.strftime('%Y-%m-%d'))
                    if not df.empty:
                        symbol = alt_symbol

                # Clean and filter dataframe (remove any NaN rows from incomplete market days)
                df = df.dropna(subset=['Open', 'High', 'Low', 'Close'])
                df = df[(df['Open'] > 0) & (df['High'] > 0) & (df['Low'] > 0) & (df['Close'] > 0)]

                if df.empty:
                    self.send_response(404)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': f'Symbol "{symbol_raw}" data not found or has no valid prices.'}).encode('utf-8'))
                    return

                # Take requested timeframe rows
                df = df.tail(period_days)

                data = []
                for index, row in df.iterrows():
                    date_str = index.strftime('%Y-%m-%d')
                    try:
                        o = float(row['Open'])
                        h = float(row['High'])
                        l = float(row['Low'])
                        c = float(row['Close'])
                        
                        # Validate numbers are finite and positive
                        if math.isnan(o) or math.isnan(h) or math.isnan(l) or math.isnan(c):
                            continue
                        if math.isinf(o) or math.isinf(h) or math.isinf(l) or math.isinf(c):
                            continue
                        if o <= 0 or h <= 0 or l <= 0 or c <= 0:
                            continue

                        vol_raw = row.get('Volume', 0)
                        v = int(vol_raw) if (pd.notna(vol_raw) and not math.isnan(float(vol_raw))) else 0

                        data.append({
                            'date': date_str,
                            'open': round(o, 2),
                            'high': round(h, 2),
                            'low': round(l, 2),
                            'close': round(c, 2),
                            'volume': v
                        })
                    except Exception:
                        continue

                if not data:
                    self.send_response(404)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': f'No valid price data could be formatted for "{symbol_raw}".'}).encode('utf-8'))
                    return

                # Fetch basic info for stock name
                stock_name = symbol_raw
                # Check DB name first
                db_item = next((item for item in STOCK_DATABASE if item['code'] == symbol_raw), None)
                if db_item:
                    stock_name = db_item['name']
                else:
                    try:
                        info = ticker.info
                        stock_name = info.get('shortName') or info.get('longName') or symbol_raw
                    except Exception:
                        pass

                response_payload = {
                    'symbol': symbol_raw,
                    'ticker': symbol,
                    'name': stock_name,
                    'count': len(data),
                    'data': data
                }

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response_payload, ensure_ascii=False, allow_nan=False).encode('utf-8'))
                return

            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}, ensure_ascii=False, allow_nan=False).encode('utf-8'))
                return

        # Otherwise serve static files
        return super().do_GET()

if __name__ == '__main__':
    with socketserver.TCPServer(("", PORT), StockSimHTTPRequestHandler) as httpd:
        print(f"Serving Stock Simulator API & Web App at http://localhost:{PORT}")
        httpd.serve_forever()

