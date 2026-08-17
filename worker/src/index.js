export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const corsHeaders = {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    };

    // Health check endpoint
    if (url.pathname === "/" || url.pathname === "/health") {
      return new Response(
        JSON.stringify({ status: "ok", service: "NOSTOS BuyTheDip Live Market API" }),
        { headers: corsHeaders }
      );
    }

    // Endpoint: /api/stock
    if (url.pathname === "/api/stock") {
      const symbolRaw = (url.searchParams.get("symbol") || "005930").trim();
      const days = parseInt(url.searchParams.get("days") || "250", 10);

      const codeMatch = symbolRaw.match(/\b\d{6}\b/);
      const code = codeMatch ? codeMatch[0] : symbolRaw;
      const errors = [];

      // 1. Try Naver Mobile API
      if (/^\d{6}$/.test(code)) {
        try {
          const naverUrl = `https://fchart.stock.naver.com/sise.nhn?symbol=${code}&timeframe=day&count=${days}&requestType=0`;
          const naverRes = await fetch(naverUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
          });

          if (naverRes.ok) {
            const xmlText = await naverRes.text();
            const itemRegex = /<item\s+data="(\d{8})\|([0-9.]+)\|([0-9.]+)\|([0-9.]+)\|([0-9.]+)\|([0-9.]+)"\s*\/>/g;
            const data = [];
            let match;

            while ((match = itemRegex.exec(xmlText)) !== null) {
              const dStr = match[1];
              const date = `${dStr.slice(0, 4)}-${dStr.slice(4, 6)}-${dStr.slice(6, 8)}`;
              const open = parseFloat(match[2]);
              const high = parseFloat(match[3]);
              const low = parseFloat(match[4]);
              const close = parseFloat(match[5]);
              const volume = parseInt(match[6], 10);

              if (open > 0 && high > 0 && low > 0 && close > 0) {
                data.push({ date, open, high, low, close, volume });
              }
            }

            if (data.length > 0) {
              return new Response(
                JSON.stringify({
                  symbol: code,
                  ticker: `${code}.KS`,
                  name: symbolRaw,
                  count: data.length,
                  data: data,
                }),
                { headers: corsHeaders }
              );
            }
          } else {
            errors.push(`Naver status: ${naverRes.status}`);
          }
        } catch (err) {
          errors.push(`Naver error: ${err.message}`);
        }
      }

      // 2. Try Yahoo Finance
      try {
        let ticker = code;
        if (/^\d{6}$/.test(code)) {
          ticker = `${code}.KS`;
        }

        const yUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
          ticker
        )}?range=1y&interval=1d`;
        const yRes = await fetch(yUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });

        if (yRes.ok) {
          const yJson = await yRes.json();
          const result = yJson?.chart?.result?.[0];
          if (result && result.timestamp && result.indicators?.quote?.[0]) {
            const timestamps = result.timestamp;
            const quote = result.indicators.quote[0];
            const data = [];

            for (let i = 0; i < timestamps.length; i++) {
              const d = new Date(timestamps[i] * 1000);
              const date = d.toISOString().split("T")[0];
              const o = quote.open?.[i];
              const h = quote.high?.[i];
              const l = quote.low?.[i];
              const c = quote.close?.[i];
              const v = quote.volume?.[i] || 0;

              if (
                typeof o === "number" &&
                typeof h === "number" &&
                typeof l === "number" &&
                typeof c === "number" &&
                o > 0 &&
                h > 0 &&
                l > 0 &&
                c > 0
              ) {
                data.push({
                  date,
                  open: Math.round(o * 100) / 100,
                  high: Math.round(h * 100) / 100,
                  low: Math.round(l * 100) / 100,
                  close: Math.round(c * 100) / 100,
                  volume: Math.round(v),
                });
              }
            }

            const finalData = data.slice(-days);
            if (finalData.length > 0) {
              return new Response(
                JSON.stringify({
                  symbol: code,
                  ticker: ticker,
                  name: symbolRaw,
                  count: finalData.length,
                  data: finalData,
                }),
                { headers: corsHeaders }
              );
            }
          }
        } else {
          errors.push(`Yahoo status: ${yRes.status}`);
        }
      } catch (err) {
        errors.push(`Yahoo error: ${err.message}`);
      }

      return new Response(
        JSON.stringify({ error: `Could not fetch live market data for ${symbolRaw}`, details: errors }),
        { status: 404, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ error: "Not Found" }),
      { status: 404, headers: corsHeaders }
    );
  },
};
