/**
 * Buy The Dip (눌림목 매수/매도) 시뮬레이터 JavaScript Engine
 * User Journey Version:
 * 1. Stock Search Hero & Recent Searches
 * 2. AI Strategy Presets & Pill-Type KPIs
 * 3. Full-Width Main Chart with Fullscreen Mode & 10px Recognizable Legend
 * 4. Dedicated Equity Curve Modal & Trade Log Modal with Filtering & CSV Export
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const runSimBtn = document.getElementById('runSimBtn');

  // Search & Recent Searches
  const stockSearchInput = document.getElementById('stockSearchInput');
  const clearSearchInputBtn = document.getElementById('clearSearchInputBtn');
  const searchResultsDiv = document.getElementById('searchResults');
  const selectedSymbolInput = document.getElementById('selectedSymbol');
  const recentChipsContainer = document.getElementById('recentChipsContainer');
  const clearRecentBtn = document.getElementById('clearRecentBtn');

  // Settings
  const initialCapitalInput = document.getElementById('initialCapital');
  const initialCapitalSelect = document.getElementById('initialCapitalSelect');
  const timeframeSelect = document.getElementById('timeframe');
  const estimationBtn = document.getElementById('estimationBtn');
  const toggleCustomSettingsBtn = document.getElementById('toggleCustomSettingsBtn');
  const customSettingsDrawer = document.getElementById('customSettingsDrawer');
  const toggleArrow = document.querySelector('.toggle-arrow');

  // Custom Controls
  const trendMaSelect = document.getElementById('trendMa');
  const dipTypeSelect = document.getElementById('dipType');
  const rsiThresholdInput = document.getElementById('rsiThreshold');
  const rsiValSpan = document.getElementById('rsiVal');
  const takeProfitInput = document.getElementById('takeProfit');
  const stopLossInput = document.getElementById('stopLoss');
  const useTrailingStopCheck = document.getElementById('useTrailingStop');
  const trailingPctInput = document.getElementById('trailingPct');
  const trailingValSpan = document.getElementById('trailingVal');
  const useTimeCutCheck = document.getElementById('useTimeCut');
  const maxHoldDaysInput = document.getElementById('maxHoldDays');
  const holdDaysValSpan = document.getElementById('holdDaysVal');
  const slippageFeeInput = document.getElementById('slippageFee');

  // Pill KPI elements
  const kpiTotalReturn = document.getElementById('kpiTotalReturn');
  const kpiFinalBalance = document.getElementById('kpiFinalBalance');
  const kpiWinRate = document.getElementById('kpiWinRate');
  const kpiWinCount = document.getElementById('kpiWinCount');
  const kpiProfitFactor = document.getElementById('kpiProfitFactor');
  const kpiAvgReturn = document.getElementById('kpiAvgReturn');
  const kpiMDD = document.getElementById('kpiMDD');
  const kpiTradeCount = document.getElementById('kpiTradeCount');
  const headerTradeCount = document.getElementById('headerTradeCount');

  // Chart Header elements
  const chartSymbolName = document.getElementById('chartSymbolName');
  const stockRealTitleSpan = document.getElementById('stockRealTitle');
  const mainChartCard = document.getElementById('mainChartCard');
  const fullscreenToggleBtn = document.getElementById('fullscreenToggleBtn');
  const fullscreenIcon = document.getElementById('fullscreenIcon');
  const fullscreenLabel = document.getElementById('fullscreenLabel');

  // Modals & Navigation
  const navEquityBtn = document.getElementById('navEquityBtn');
  const openEquityPillBtn = document.getElementById('openEquityPillBtn');
  const chartEquityModalBtn = document.getElementById('chartEquityModalBtn');
  const equityModal = document.getElementById('equityModal');
  const closeEquityModalBtn = document.getElementById('closeEquityModalBtn');
  const modalFinalBalance = document.getElementById('modalFinalBalance');
  const modalBuyHoldBalance = document.getElementById('modalBuyHoldBalance');
  const modalAlpha = document.getElementById('modalAlpha');

  const navTradeLogBtn = document.getElementById('navTradeLogBtn');
  const openTradeLogPillBtn = document.getElementById('openTradeLogPillBtn');
  const tradeLogModal = document.getElementById('tradeLogModal');
  const closeTradeLogModalBtn = document.getElementById('closeTradeLogModalBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const tradeLogBody = document.getElementById('tradeLogBody');
  const logCountSpan = document.getElementById('logCount');

  // Filter Tabs in Trade Log Modal
  const filterTabs = document.querySelectorAll('.btn-filter-tab');
  const filterAllCount = document.getElementById('filterAllCount');
  const filterTpCount = document.getElementById('filterTpCount');
  const filterSlCount = document.getElementById('filterSlCount');
  const filterTsCount = document.getElementById('filterTsCount');
  const filterTcCount = document.getElementById('filterTcCount');

  // Global State
  let currentTrades = [];
  let currentActiveFilter = 'all';
  let priceChartInstance = null;
  let equityChartInstance = null;
  let latestEquityData = null;
  let KRX_MASTER_DB = [];

  // Asynchronously load KRX Master Database for frontend autocomplete & fallback
  async function loadMasterDB() {
    try {
      const res = await fetch('./krx_stocks.json');
      if (res.ok) {
        KRX_MASTER_DB = await res.json();
      }
    } catch (e) {
      console.warn("Could not load local krx_stocks.json:", e);
    }
  }
  loadMasterDB();

  // AI Presets mapping
  const PRESETS = {
    balanced: {
      name: "기본 매수",
      trendMa: "60", dipType: "ma20_rsi", rsiThreshold: 45,
      takeProfit: 6.0, stopLoss: 3.0, useTrailing: true, trailingPct: 3.0,
      useTimeCut: true, maxHoldDays: 7
    },
    trailing: {
      name: "대세 추종 매수",
      trendMa: "60", dipType: "ma20_rsi", rsiThreshold: 48,
      takeProfit: 12.0, stopLoss: 3.5, useTrailing: true, trailingPct: 2.5,
      useTimeCut: false, maxHoldDays: 14
    },
    timecut: {
      name: "타임컷(4일 미상승 청산)",
      trendMa: "0", dipType: "ma20_rsi", rsiThreshold: 40,
      takeProfit: 4.0, stopLoss: 2.0, useTrailing: false, trailingPct: 2.0,
      useTimeCut: true, maxHoldDays: 4
    },
    aggressive: {
      name: "120일선 스윙",
      trendMa: "120", dipType: "drop_pct", rsiThreshold: 50,
      takeProfit: 8.0, stopLoss: 2.5, useTrailing: true, trailingPct: 3.5,
      useTimeCut: true, maxHoldDays: 10
    }
  };

  // -------------------------------------------------------------
  // 1. Recent Searches Manager (LocalStorage)
  // -------------------------------------------------------------
  const DEFAULT_RECENT = [
    { name: '삼성전자', code: '005930' },
    { name: 'SK하이닉스', code: '000660' },
    { name: '알테오젠', code: '196170' },
    { name: '현대차', code: '005380' },
    { name: '에코프로비엠', code: '247540' }
  ];

  function getRecentSearches() {
    try {
      const stored = localStorage.getItem('btd_recent_searches');
      return stored ? JSON.parse(stored) : DEFAULT_RECENT;
    } catch {
      return DEFAULT_RECENT;
    }
  }

  function saveRecentSearches(list) {
    try {
      localStorage.setItem('btd_recent_searches', JSON.stringify(list));
    } catch (e) {
      console.error('LocalStorage write failed:', e);
    }
  }

  function addRecentSearch(name, code) {
    if (!code) return;
    let list = getRecentSearches();
    list = list.filter(item => item.code !== code);
    list.unshift({ name, code });
    if (list.length > 8) list = list.slice(0, 8);
    saveRecentSearches(list);
    renderRecentSearches();
  }

  function renderRecentSearches() {
    const list = getRecentSearches();
    if (list.length === 0) {
      recentChipsContainer.innerHTML = '<span style="font-size:11.5px; color:var(--text-dim);">최근 검색 기록이 없습니다.</span>';
      return;
    }

    recentChipsContainer.innerHTML = list.map(item => `
      <div class="recent-chip" data-code="${item.code}" data-name="${item.name}">
        <span>${item.name}</span>
        <i class="fa-solid fa-xmark recent-chip-remove" data-remove="${item.code}" title="삭제"></i>
      </div>
    `).join('');

    // Chip click to search & remove click
    recentChipsContainer.querySelectorAll('.recent-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        if (e.target.classList.contains('recent-chip-remove')) {
          e.stopPropagation();
          const removeCode = e.target.getAttribute('data-remove');
          let currentList = getRecentSearches().filter(it => it.code !== removeCode);
          saveRecentSearches(currentList);
          renderRecentSearches();
          return;
        }

        const code = chip.getAttribute('data-code');
        const name = chip.getAttribute('data-name');
        selectedSymbolInput.value = code;
        stockSearchInput.value = `${name} (${code})`;
        addRecentSearch(name, code);
        runSimulation();
      });
    });
  }

  clearRecentBtn.addEventListener('click', () => {
    saveRecentSearches([]);
    renderRecentSearches();
  });

  renderRecentSearches();

  // -------------------------------------------------------------
  // Initial Capital, Timeframe & Estimation CTA Listeners
  // -------------------------------------------------------------
  if (initialCapitalSelect) {
    initialCapitalSelect.addEventListener('change', () => {
      const selVal = initialCapitalSelect.value;
      if (selVal === '10x') {
        if (cachedRawData && cachedRawData.length > 0) {
          const lastClose = cachedRawData[cachedRawData.length - 1].close;
          const default10x = Math.round(lastClose * 10);
          initialCapitalInput.value = default10x.toLocaleString('ko-KR');
        }
      } else {
        const amount = Number(selVal);
        initialCapitalInput.value = amount.toLocaleString('ko-KR');
      }
      runSimulation();
    });
  }

  if (timeframeSelect) {
    timeframeSelect.addEventListener('change', () => {
      runSimulation();
    });
  }

  if (estimationBtn) {
    estimationBtn.addEventListener('click', () => {
      estimationBtn.classList.remove('leonardo-pulse');
      void estimationBtn.offsetWidth;
      estimationBtn.classList.add('leonardo-pulse');
      runSimulation();
    });
  }

  clearSearchInputBtn.addEventListener('click', () => {
    stockSearchInput.value = '';
    stockSearchInput.focus();
  });

  // -------------------------------------------------------------
  // Stock Search / Autocomplete Engine
  // -------------------------------------------------------------
  let searchTimeout = null;

  stockSearchInput.addEventListener('focus', () => {
    fetchSearchResults(stockSearchInput.value.trim());
  });

  stockSearchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      fetchSearchResults(e.target.value.trim());
    }, 200);
  });

  stockSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchResultsDiv.classList.remove('active');
      runSimulation();
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-input-box-wrapper')) {
      searchResultsDiv.classList.remove('active');
    }
  });

  async function fetchSearchResults(query) {
    if (!query) return;
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        renderSearchResults(data.results || []);
        return;
      }
    } catch (err) {
      // API not available, proceed to local search
    }

    // Local in-memory search from KRX_MASTER_DB
    if (KRX_MASTER_DB && KRX_MASTER_DB.length > 0) {
      const q = query.toLowerCase().trim();
      const matched = KRX_MASTER_DB.filter(item => 
        (item.name && item.name.toLowerCase().includes(q)) || 
        (item.code && item.code.includes(q)) ||
        (item.choseong && item.choseong.includes(q))
      ).slice(0, 15);
      renderSearchResults(matched);
    }
  }

  function renderSearchResults(results) {
    if (results.length === 0) {
      searchResultsDiv.innerHTML = `<div class="search-item"><span class="search-item-name">검색 결과가 없습니다.</span></div>`;
      searchResultsDiv.classList.add('active');
      return;
    }

    searchResultsDiv.innerHTML = results.map(item => {
      let tagClass = 'market-tag';
      if (item.market === 'KOSPI') tagClass += ' kospi';
      else if (item.market === 'KOSDAQ') tagClass += ' kosdaq';
      else tagClass += ' us';

      return `
        <div class="search-item" data-code="${item.code}" data-name="${item.name}">
          <div class="search-item-info">
            <span class="${tagClass}">${item.market}</span>
            <span class="search-item-name">${item.name}</span>
          </div>
          <span class="search-item-code">${item.code} (${item.category})</span>
        </div>
      `;
    }).join('');

    searchResultsDiv.classList.add('active');

    searchResultsDiv.querySelectorAll('.search-item').forEach(el => {
      el.addEventListener('click', () => {
        const code = el.getAttribute('data-code');
        const name = el.getAttribute('data-name');
        if (!code) return;

        selectedSymbolInput.value = code;
        stockSearchInput.value = `${name} (${code})`;
        searchResultsDiv.classList.remove('active');
        addRecentSearch(name, code);
        runSimulation();
      });
    });
  }

  // -------------------------------------------------------------
  // AI Strategy Preset Buttons Listener
  // -------------------------------------------------------------
  const presetBtns = document.querySelectorAll('.btn-preset');
  presetBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      presetBtns.forEach(b => b.classList.remove('active'));
      const btnEl = e.currentTarget;
      btnEl.classList.add('active');

      const presetKey = btnEl.getAttribute('data-preset');
      const p = PRESETS[presetKey];
      if (!p) return;

      if (trendMaSelect) trendMaSelect.value = p.trendMa;
      if (dipTypeSelect) dipTypeSelect.value = p.dipType;
      if (rsiThresholdInput) {
        rsiThresholdInput.value = p.rsiThreshold;
        if (rsiValSpan) rsiValSpan.textContent = p.rsiThreshold;
      }
      if (takeProfitInput) takeProfitInput.value = p.takeProfit;
      if (stopLossInput) stopLossInput.value = p.stopLoss;
      
      if (useTrailingStopCheck) useTrailingStopCheck.checked = p.useTrailing;
      if (trailingPctInput) {
        trailingPctInput.value = p.trailingPct;
        if (trailingValSpan) trailingValSpan.textContent = p.trailingPct;
      }

      if (useTimeCutCheck) useTimeCutCheck.checked = p.useTimeCut;
      if (maxHoldDaysInput) {
        maxHoldDaysInput.value = p.maxHoldDays;
        if (holdDaysValSpan) holdDaysValSpan.textContent = p.maxHoldDays;
      }

      // If 120MA Swing preset is selected, automatically activate 120MA line
      if (presetKey === 'aggressive') {
        const btn120 = document.querySelector('.legend-ma-tag.ma-btn[data-ma="120"]');
        if (btn120) btn120.classList.add('active');
        if (priceChartInstance && priceChartInstance.data && priceChartInstance.data.datasets[MA_DATASET_MAP['120']]) {
          priceChartInstance.data.datasets[MA_DATASET_MAP['120']].hidden = false;
        }
      }

      runSimulation();
    });
  });

  if (timeframeSelect) timeframeSelect.addEventListener('change', runSimulation);
  if (runSimBtn) runSimBtn.addEventListener('click', runSimulation);

  // -------------------------------------------------------------
  // Modals & Navigation Event Listeners
  // -------------------------------------------------------------
  function openEquityModal() {
    equityModal.style.display = 'flex';
    requestAnimationFrame(() => {
      renderEquityModalChart();
    });
  }
  function closeEquityModal() {
    equityModal.style.display = 'none';
  }

  function openTradeLogModal() {
    tradeLogModal.style.display = 'flex';
  }
  function closeTradeLogModal() {
    tradeLogModal.style.display = 'none';
  }

  if (navEquityBtn) navEquityBtn.addEventListener('click', openEquityModal);
  if (openEquityPillBtn) openEquityPillBtn.addEventListener('click', openEquityModal);
  if (chartEquityModalBtn) chartEquityModalBtn.addEventListener('click', openEquityModal);
  if (closeEquityModalBtn) closeEquityModalBtn.addEventListener('click', closeEquityModal);

  if (navTradeLogBtn) navTradeLogBtn.addEventListener('click', openTradeLogModal);
  if (openTradeLogPillBtn) openTradeLogPillBtn.addEventListener('click', openTradeLogModal);
  if (closeTradeLogModalBtn) closeTradeLogModalBtn.addEventListener('click', closeTradeLogModal);

  // Close modals on background click or Escape key
  [equityModal, tradeLogModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      equityModal.style.display = 'none';
      tradeLogModal.style.display = 'none';
    }
  });

  // -------------------------------------------------------------
  // Trade Log Filter Tabs & CSV Export
  // -------------------------------------------------------------
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentActiveFilter = tab.getAttribute('data-filter');
      renderFilteredTrades();
    });
  });

  // -------------------------------------------------------------
  // Chart Legend Signal Filter & Highlight Event Listeners
  // -------------------------------------------------------------
  document.querySelectorAll('.legend-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sig = btn.dataset.signal;
      if (sig === currentActiveSignal && sig !== 'ALL') {
        applyLegendSignalFilter('ALL');
      } else {
        applyLegendSignalFilter(sig);
      }
    });
  });

  // Moving Average (MA) Interactive Toggle Listeners (5MA, 20MA, 60MA, 120MA)
  document.querySelectorAll('.legend-ma-tag.ma-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const maKey = e.currentTarget.getAttribute('data-ma');
      const datasetIdx = MA_DATASET_MAP[maKey];
      if (!priceChartInstance || datasetIdx === undefined) return;

      const dataset = priceChartInstance.data.datasets[datasetIdx];
      if (!dataset) return;

      const willBeHidden = !dataset.hidden;
      dataset.hidden = willBeHidden;
      e.currentTarget.classList.toggle('active', !willBeHidden);
      priceChartInstance.update('none');
    });
  });

  exportCsvBtn.addEventListener('click', () => {
    if (currentTrades.length === 0) {
      alert('다운로드할 거래 내역이 없습니다.');
      return;
    }

    const headers = ['거래번호', '진입일자', '진입가', '청산일자', '청산가', '보유기간(일)', '수익률(%)', '청산사유'];
    const rows = currentTrades.map(t => [
      t.id,
      t.entryDate,
      t.entryPrice,
      t.exitDate,
      t.exitPrice,
      t.holdDays,
      t.returnPct,
      t.reason
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BuyTheDip_TradeLog_${selectedSymbolInput.value || 'Stock'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // -------------------------------------------------------------
  // Fullscreen Mode Toggle & Re-rendering Engine
  // -------------------------------------------------------------
  function triggerChartResize() {
    if (!priceChartInstance) return;
    const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || (mainChartCard && mainChartCard.classList.contains('is-fullscreen')));

    // In Fullscreen, optimize tick density and font sizing for widescreen monitors
    if (priceChartInstance.options && priceChartInstance.options.scales && priceChartInstance.options.scales.x) {
      priceChartInstance.options.scales.x.ticks.maxTicksLimit = isFs ? 18 : 10;
      if (priceChartInstance.options.scales.x.ticks.font) {
        priceChartInstance.options.scales.x.ticks.font.size = isFs ? 12 : 11;
      }
    }
    if (priceChartInstance.options && priceChartInstance.options.scales && priceChartInstance.options.scales.y) {
      if (priceChartInstance.options.scales.y.ticks.font) {
        priceChartInstance.options.scales.y.ticks.font.size = isFs ? 12 : 11;
      }
    }

    priceChartInstance.resize();
    updateDynamicMarkerScale(priceChartInstance);
    priceChartInstance.update('none');
  }

  function handleFullscreenToggle() {
    const isCurrentlyFs = !!(document.fullscreenElement || document.webkitFullscreenElement || (mainChartCard && mainChartCard.classList.contains('is-fullscreen')));

    if (!isCurrentlyFs) {
      if (mainChartCard.requestFullscreen) {
        mainChartCard.requestFullscreen().then(() => {
          mainChartCard.classList.add('is-fullscreen');
          triggerChartResize();
        }).catch(() => {
          mainChartCard.classList.add('is-fullscreen');
          triggerChartResize();
        });
      } else if (mainChartCard.webkitRequestFullscreen) {
        mainChartCard.webkitRequestFullscreen();
        mainChartCard.classList.add('is-fullscreen');
      } else {
        mainChartCard.classList.add('is-fullscreen');
        triggerChartResize();
      }
      if (fullscreenIcon) fullscreenIcon.className = 'fa-solid fa-compress';
      if (fullscreenLabel) fullscreenLabel.textContent = '창 모드';
      if (fullscreenToggleBtn) fullscreenToggleBtn.classList.add('active');
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
      if (mainChartCard) mainChartCard.classList.remove('is-fullscreen');
      if (fullscreenIcon) fullscreenIcon.className = 'fa-solid fa-expand';
      if (fullscreenLabel) fullscreenLabel.textContent = '전체화면';
      if (fullscreenToggleBtn) fullscreenToggleBtn.classList.remove('active');
      triggerChartResize();
    }

    [30, 80, 150, 300, 500].forEach(delay => setTimeout(triggerChartResize, delay));
  }

  fullscreenToggleBtn.addEventListener('click', handleFullscreenToggle);

  ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(evt => {
    document.addEventListener(evt, () => {
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || (mainChartCard && mainChartCard.classList.contains('is-fullscreen')));
      if (mainChartCard) {
        if (isFs) {
          mainChartCard.classList.add('is-fullscreen');
        } else {
          mainChartCard.classList.remove('is-fullscreen');
        }
      }
      if (fullscreenIcon) fullscreenIcon.className = isFs ? 'fa-solid fa-compress' : 'fa-solid fa-expand';
      if (fullscreenLabel) fullscreenLabel.textContent = isFs ? '창 모드' : '전체화면';
      if (fullscreenToggleBtn) fullscreenToggleBtn.classList.toggle('active', isFs);
      [30, 80, 150, 300, 500].forEach(delay => setTimeout(triggerChartResize, delay));
    });
  });

  window.addEventListener('resize', () => {
    triggerChartResize();
  });

  // Observe chart container dimension changes for responsive adaptations
  const chartContainerElem = document.getElementById('priceChartContainer');
  if (chartContainerElem && window.ResizeObserver) {
    const ro = new ResizeObserver(() => {
      triggerChartResize();
    });
    ro.observe(chartContainerElem);
  }

  // -------------------------------------------------------------
  // Real Market Data Fetcher & Technical Indicators
  // -------------------------------------------------------------
  const LIVE_API_BASE = 'https://buythedip-api.drbrooks-kim.workers.dev';

  async function fetchRealStockData(symbol, numDays) {
    stockRealTitleSpan.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="font-size: 9px; margin-right: 4px;"></i> 실시간 시세 수집 중...';
    stockRealTitleSpan.style.background = "rgba(0, 217, 146, 0.10)";
    stockRealTitleSpan.style.color = "#00D992";

    try {
      const endpoints = [
        `/api/stock?symbol=${encodeURIComponent(symbol)}&days=${numDays}`,
        `${LIVE_API_BASE}/api/stock?symbol=${encodeURIComponent(symbol)}&days=${numDays}`
      ];

      let result = null;
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint);
          if (response.ok) {
            result = await response.json();
            if (result && result.data && result.data.length > 0) break;
          }
        } catch (e) {
          // try next live endpoint
        }
      }

      if (!result || !result.data || result.data.length === 0) {
        throw new Error("유효한 실시간 시세 데이터가 없습니다.");
      }

      let stockDisplayName = result.name || symbol;
      if (KRX_MASTER_DB && KRX_MASTER_DB.length > 0) {
        const cleanSym = symbol.replace('.KS', '').replace('.KQ', '');
        const found = KRX_MASTER_DB.find(s => s.code === cleanSym || s.name.toLowerCase() === symbol.toLowerCase() || s.name.includes(symbol));
        if (found) stockDisplayName = found.name;
      }

      const displayName = `${stockDisplayName} (${result.ticker || symbol})`;
      chartSymbolName.textContent = displayName;
      stockRealTitleSpan.innerHTML = `<i class="fa-solid fa-circle" style="font-size: 7px; color: #00D992; margin-right: 5px;"></i> 실시간 데이터 수신 완료 (${result.data.length}일)`;
      stockRealTitleSpan.style.background = "rgba(0, 217, 146, 0.14)";
      stockRealTitleSpan.style.color = "#00D992";

      const rawData = result.data
        .filter(item => item && typeof item.close === 'number' && !isNaN(item.close) && item.close > 0)
        .map(item => ({
          date: item.date,
          open: Number(item.open) || Number(item.close),
          high: Number(item.high) || Number(item.close),
          low: Number(item.low) || Number(item.close),
          close: Number(item.close),
          volume: Number(item.volume) || 0
        }));

      if (rawData.length === 0) {
        throw new Error("유효한 가격 데이터가 부족합니다.");
      }

      // Calculate Technical Indicators
      const closes = rawData.map(d => d.close);
      const sma5 = calculateSMA(closes, 5);
      const sma20 = calculateSMA(closes, 20);
      const sma60 = calculateSMA(closes, 60);
      const sma120 = calculateSMA(closes, 120);
      const rsi14 = calculateRSI(closes, 14);
      const bollingerLower = calculateBollingerLower(closes, 20, 2);
      const atr14 = calculateATR(rawData, 14);

      for (let i = 0; i < rawData.length; i++) {
        rawData[i].sma5 = sma5[i];
        rawData[i].sma20 = sma20[i];
        rawData[i].sma60 = sma60[i];
        rawData[i].sma120 = sma120[i];
        rawData[i].rsi = rsi14[i];
        rawData[i].bollingerLower = bollingerLower[i];
        rawData[i].atr = atr14[i];
      }

      return rawData;
    } catch (err) {
      console.warn("API 시세 수집 불가 (정적 호스팅 환경 감지), 데모 시뮬레이션 모드로 전환합니다:", err.message);
      return generateRealisticFallbackData(symbol, numDays);
    }
  }

  function generateRealisticFallbackData(symbol, numDays) {
    let matchedName = symbol;
    if (KRX_MASTER_DB && KRX_MASTER_DB.length > 0) {
      const cleanSym = symbol.replace('.KS', '').replace('.KQ', '');
      const found = KRX_MASTER_DB.find(s => s.code === cleanSym || s.name.toLowerCase() === symbol.toLowerCase() || s.name.includes(symbol));
      if (found) matchedName = found.name;
    }

    const displayName = `${matchedName} (${symbol})`;
    chartSymbolName.textContent = displayName;
    stockRealTitleSpan.textContent = `웹 데모 시뮬레이션 (${numDays}일)`;
    stockRealTitleSpan.style.background = "rgba(0, 217, 146, 0.12)";
    stockRealTitleSpan.style.color = "#00D992";

    // Deterministic seed based on symbol string
    let seed = 0;
    for (let c of symbol) seed = (seed * 31 + c.charCodeAt(0)) % 1000000;
    function pseudoRandom() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    }

    let basePrice = 50000;
    if (symbol.includes('005930')) basePrice = 74000;
    else if (symbol.includes('000660')) basePrice = 185000;
    else if (symbol.includes('005380')) basePrice = 245000;
    else if (symbol.includes('035420')) basePrice = 192000;
    else if (symbol.includes('042700')) basePrice = 148000;
    else if (symbol.includes('189330')) basePrice = 9800;
    else if (symbol.includes('247540')) basePrice = 85000;
    else {
      basePrice = 12000 + Math.floor(pseudoRandom() * 88000);
    }

    const rawData = [];
    const today = new Date();
    let curClose = basePrice;

    // Generate date sequence
    const dates = [];
    let d = new Date(today);
    while (dates.length < numDays) {
      d.setDate(d.getDate() - 1);
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Weekdays only
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dates.unshift(`${y}-${m}-${day}`);
      }
    }

    for (let i = 0; i < dates.length; i++) {
      const dailyDrift = 0.0004;
      const volatility = 0.022;
      const shock = (pseudoRandom() - 0.49) * volatility;
      curClose = Math.max(1000, curClose * (1 + dailyDrift + shock));

      const dailySpread = curClose * (0.01 + pseudoRandom() * 0.015);
      const openPrice = curClose + (pseudoRandom() - 0.5) * dailySpread;
      const highPrice = Math.max(openPrice, curClose) + pseudoRandom() * (dailySpread * 0.8);
      const lowPrice = Math.min(openPrice, curClose) - pseudoRandom() * (dailySpread * 0.8);
      const volume = Math.floor(100000 + pseudoRandom() * 1500000);

      rawData.push({
        date: dates[i],
        open: Math.round(openPrice),
        high: Math.round(highPrice),
        low: Math.round(lowPrice),
        close: Math.round(curClose),
        volume: volume
      });
    }

    const closes = rawData.map(d => d.close);
    const sma5 = calculateSMA(closes, 5);
    const sma20 = calculateSMA(closes, 20);
    const sma60 = calculateSMA(closes, 60);
    const sma120 = calculateSMA(closes, 120);
    const rsi14 = calculateRSI(closes, 14);
    const bollingerLower = calculateBollingerLower(closes, 20, 2);
    const atr14 = calculateATR(rawData, 14);

    for (let i = 0; i < rawData.length; i++) {
      rawData[i].sma5 = sma5[i];
      rawData[i].sma20 = sma20[i];
      rawData[i].sma60 = sma60[i];
      rawData[i].sma120 = sma120[i];
      rawData[i].rsi = rsi14[i];
      rawData[i].bollingerLower = bollingerLower[i];
      rawData[i].atr = atr14[i];
    }

    return rawData;
  }

  function calculateSMA(data, period) {
    const sma = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        sma.push(null);
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        sma.push(Math.round((sum / period) * 100) / 100);
      }
    }
    return sma;
  }

  function calculateRSI(closes, period = 14) {
    const rsi = new Array(closes.length).fill(null);
    if (closes.length <= period) return rsi;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;
    rsi[period] = 100 - (100 / (1 + (avgGain / (avgLoss || 0.001))));

    for (let i = period + 1; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      const gain = diff >= 0 ? diff : 0;
      const loss = diff < 0 ? -diff : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;

      const rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss);
      rsi[i] = Math.round((100 - (100 / (1 + rs))) * 100) / 100;
    }
    return rsi;
  }

  function calculateBollingerLower(closes, period = 20, multiplier = 2) {
    const lower = [];
    for (let i = 0; i < closes.length; i++) {
      if (i < period - 1) {
        lower.push(null);
      } else {
        const slice = closes.slice(i - period + 1, i + 1);
        const mean = slice.reduce((a, b) => a + b, 0) / period;
        const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
        const stdDev = Math.sqrt(variance);
        lower.push(Math.round((mean - multiplier * stdDev) * 100) / 100);
      }
    }
    return lower;
  }

  function calculateATR(rawData, period = 14) {
    const atr = new Array(rawData.length).fill(null);
    if (!rawData || rawData.length < period) return atr;

    const tr = [];
    for (let i = 0; i < rawData.length; i++) {
      if (i === 0) {
        tr.push((rawData[i].high || rawData[i].close) - (rawData[i].low || rawData[i].close));
      } else {
        const high = rawData[i].high || rawData[i].close;
        const low = rawData[i].low || rawData[i].close;
        const prevClose = rawData[i - 1].close;
        const currentTR = Math.max(
          high - low,
          Math.abs(high - prevClose),
          Math.abs(low - prevClose)
        );
        tr.push(currentTR);
      }
    }

    let sumTR = 0;
    for (let i = 0; i < period; i++) {
      sumTR += tr[i];
    }
    let currentATR = sumTR / period;
    atr[period - 1] = Math.round(currentATR * 100) / 100;

    for (let i = period; i < rawData.length; i++) {
      currentATR = (currentATR * (period - 1) + tr[i]) / period;
      atr[i] = Math.round(currentATR * 100) / 100;
    }
    return atr;
  }

  let cachedRawData = null;
  let cachedSymbol = null;
  let cachedDays = null;

  // -------------------------------------------------------------
  // Backtest Simulation Engine
  // -------------------------------------------------------------
  async function runSimulation() {
    let inputVal = (stockSearchInput.value || '').trim();
    let symbol = (selectedSymbolInput.value || '').trim();

    const codeMatch = inputVal.match(/\b\d{6}\b/);
    if (codeMatch) {
      symbol = codeMatch[0];
    } else if (/^[A-Za-z]{1,6}$/.test(inputVal)) {
      symbol = inputVal.toUpperCase();
    } else if (!symbol) {
      symbol = '005930';
    }

    const numDays = parseInt(timeframeSelect.value, 10);
    const isNewStock = (!cachedSymbol || cachedSymbol !== symbol);

    // Fetch or Reuse Cached Market Data
    let rawData = null;
    if (cachedRawData && cachedSymbol === symbol && cachedDays === numDays) {
      rawData = cachedRawData;
    } else {
      rawData = await fetchRealStockData(symbol, numDays);
      if (!rawData || rawData.length === 0) return;
      cachedRawData = rawData;
      cachedSymbol = symbol;
      cachedDays = numDays;

      // On new stock selection or initial load, auto-set default capital to 10x current stock price if 10x selected
      if (initialCapitalSelect && initialCapitalSelect.value === '10x') {
        const lastClose = rawData[rawData.length - 1].close;
        const default10xCapital = Math.round(lastClose * 10);
        initialCapitalInput.value = default10xCapital.toLocaleString('ko-KR');
      } else if (initialCapitalSelect && initialCapitalSelect.value !== '10x') {
        initialCapitalInput.value = Number(initialCapitalSelect.value).toLocaleString('ko-KR');
      }
    }

    const capital = parseFloat(initialCapitalInput.value.replace(/,/g, '')) || (rawData ? Math.round(rawData[rawData.length - 1].close * 10) : 700000);

    const trendMaPeriod = parseInt(trendMaSelect.value, 10);
    const dipType = dipTypeSelect.value;
    const rsiLimit = parseFloat(rsiThresholdInput.value);

    const takeProfitPct = parseFloat(takeProfitInput.value) / 100;
    const stopLossPct = parseFloat(stopLossInput.value) / 100;
    
    const useTrailing = useTrailingStopCheck.checked;
    const trailingPct = parseFloat(trailingPctInput.value) / 100;

    const useTimeCut = useTimeCutCheck.checked;
    const maxHoldDays = parseInt(maxHoldDaysInput.value, 10);
    const feePct = parseFloat(slippageFeeInput.value) / 100;

    let position = false;
    let entryPrice = 0;
    let entryDate = '';
    let entryIndex = 0;
    let highestPrice = 0;
    let currentBalance = capital;

    const trades = [];
    const equityCurve = [capital];
    const buyHoldEquity = [capital];
    const initialPrice = rawData[0].close;

    // Store Buy/Sell markers for charts (3px pin-point precision)
    const buyMarkers = new Array(rawData.length).fill(null);
    const tpMarkers = new Array(rawData.length).fill(null);
    const slMarkers = new Array(rawData.length).fill(null);
    const tsMarkers = new Array(rawData.length).fill(null);
    const tcMarkers = new Array(rawData.length).fill(null);

    for (let i = 1; i < rawData.length; i++) {
      const bar = rawData[i];

      // Buy & Hold equity tracking
      buyHoldEquity.push(capital * (bar.close / initialPrice));

      // Trend Filter check
      let trendOk = true;
      if (trendMaPeriod === 60 && bar.sma60) trendOk = bar.close >= bar.sma60;
      if (trendMaPeriod === 120 && bar.sma120) trendOk = bar.close >= bar.sma120;

      // Dip Condition check
      let dipOk = false;
      if (trendOk && bar.rsi) {
        if (dipType === 'ma20_rsi' && bar.sma20) {
          dipOk = (bar.close <= bar.sma20 * 1.005) && (bar.rsi <= rsiLimit);
        } else if (dipType === 'bollinger_lower' && bar.bollingerLower) {
          dipOk = bar.close <= bar.bollingerLower * 1.01;
        } else if (dipType === 'drop_pct') {
          const recentMax = Math.max(rawData[Math.max(0, i - 3)].close, rawData[Math.max(0, i - 1)].close);
          dipOk = (bar.close <= recentMax * 0.96) && (bar.rsi <= rsiLimit + 5);
        }
      }

      // Execute Trade Engine
      if (!position && dipOk && i > 30) {
        position = true;
        entryPrice = bar.close * (1 + feePct / 2);
        entryDate = bar.date;
        entryIndex = i;
        highestPrice = bar.close;
        buyMarkers[i] = bar.close;
      } else if (position) {
        highestPrice = Math.max(highestPrice, bar.high);
        const holdDays = i - entryIndex;

        const tpPrice = entryPrice * (1 + takeProfitPct);
        const slPrice = entryPrice * (1 - stopLossPct);
        
        let isTrailingStop = false;
        let tsPrice = 0;
        if (useTrailing && highestPrice >= entryPrice * 1.01) {
          tsPrice = highestPrice * (1 - trailingPct);
          isTrailingStop = bar.low <= tsPrice;
        }

        const isStopLoss = bar.low <= slPrice;
        const isTakeProfit = bar.high >= tpPrice;
        const isTimeCut = useTimeCut && holdDays >= maxHoldDays;

        if (isStopLoss || isTakeProfit || isTrailingStop || isTimeCut) {
          let exitPrice = bar.close;
          let reason = 'Take Profit';
          let badgeClass = 'badge-tp';

          if (bar.open <= slPrice) {
            exitPrice = bar.open;
            reason = 'Stop Loss';
            badgeClass = 'badge-sl';
            slMarkers[i] = exitPrice;
          } else if (bar.open >= tpPrice) {
            exitPrice = bar.open;
            reason = 'Take Profit';
            badgeClass = 'badge-tp';
            tpMarkers[i] = exitPrice;
          } else if (isStopLoss) {
            exitPrice = slPrice;
            reason = 'Stop Loss';
            badgeClass = 'badge-sl';
            slMarkers[i] = exitPrice;
          } else if (isTrailingStop) {
            exitPrice = Math.max(tsPrice, bar.low);
            reason = 'Trailing Stop';
            badgeClass = 'badge-ts';
            tsMarkers[i] = exitPrice;
          } else if (isTakeProfit) {
            exitPrice = tpPrice;
            reason = 'Take Profit';
            badgeClass = 'badge-tp';
            tpMarkers[i] = exitPrice;
          } else if (isTimeCut) {
            exitPrice = bar.close;
            reason = 'Time Cut';
            badgeClass = 'badge-tc';
            tcMarkers[i] = exitPrice;
          }

          exitPrice = exitPrice * (1 - feePct / 2);
          const tradeReturn = (exitPrice - entryPrice) / entryPrice;
          currentBalance *= (1 + tradeReturn);

          trades.push({
            id: trades.length + 1,
            entryDate,
            entryPrice: Math.round(entryPrice * 100) / 100,
            exitDate: bar.date,
            exitPrice: Math.round(exitPrice * 100) / 100,
            holdDays,
            returnPct: Math.round(tradeReturn * 10000) / 100,
            reason,
            badgeClass
          });

          position = false;
        }
      }

      equityCurve.push(Math.round(currentBalance));
    }

    currentTrades = trades;

    // Evaluate Multi-Directional AI Market Forecast (상승/하락/횡보 진단)
    const forecast = evaluateMarketForecast(rawData, trades);

    // Calculate Metrics & Render UI & Live Forecast
    updateMetrics(capital, currentBalance, trades, equityCurve, buyHoldEquity, rawData);
    renderLiveForecast(rawData, trades, forecast);
    updateFilterTabCounts(trades);
    renderFilteredTrades();
    renderCharts(rawData, buyHoldEquity, equityCurve, buyMarkers, tpMarkers, slMarkers, tsMarkers, tcMarkers, symbol, numDays, forecast);
  }

  // -------------------------------------------------------------
  // Dynamic Multi-Dimensional Tactical Commentary Generator
  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // Dynamic Multi-Dimensional Tactical Commentary Generator
  // -------------------------------------------------------------
  function generateTacticalCommentary(params) {
    const {
      stockTitleText,
      lastClose,
      sma20,
      sma60,
      sma120,
      rsi,
      dropFromHigh,
      bounceFromLow,
      momentum5d,
      recentHigh,
      recentLow,
      targetPrice,
      targetChangePct,
      expectedEntry,
      stopLoss,
      deltaRisk,
      riskPct,
      target1Price,
      target1ChangePct,
      target2Price,
      target2ChangePct,
      currentATR,
      swingHigh,
      tpPct,
      slPct,
      maxHoldDaysVal,
      probScore,
      direction,
      trades,
      rawData
    } = params;

    const diff20Pct = sma20 > 0 ? ((lastClose - sma20) / sma20) * 100 : 0;
    const diff60Pct = sma60 > 0 ? ((lastClose - sma60) / sma60) * 100 : 0;
    const isAbove20 = lastClose >= sma20;
    const isAbove60 = lastClose >= sma60;
    const isGoldenCross = sma20 >= sma60;

    // 1. Moving Average & Price Structure Sentence
    let trendSentence = '';
    if (isAbove20 && isAbove60 && isGoldenCross) {
      trendSentence = `<strong>${stockTitleText}</strong>은(는) 현재가 ₩ ${Math.round(lastClose).toLocaleString()} 기준 20일선(₩ ${Math.round(sma20).toLocaleString()}, ${diff20Pct >= 0 ? '+' : ''}${diff20Pct.toFixed(1)}%)과 60일선(₩ ${Math.round(sma60).toLocaleString()}) 상단에서 정배열 상승 추세를 견고히 유지하고 있습니다.`;
    } else if (isAbove60 && isGoldenCross && !isAbove20) {
      trendSentence = `<strong>${stockTitleText}</strong>은(는) 20일선(₩ ${Math.round(sma20).toLocaleString()}) 아래로 일시 조정을 받고 있으나, 60일 중기 지지선(₩ ${Math.round(sma60).toLocaleString()}, ${diff60Pct >= 0 ? '+' : ''}${diff60Pct.toFixed(1)}%) 상단에서 반등 지지력을 확보하며 눌림목을 형성 중입니다.`;
    } else if (isAbove20 && !isAbove60) {
      trendSentence = `<strong>${stockTitleText}</strong>은(는) 단기 20일선(₩ ${Math.round(sma20).toLocaleString()})을 상향 돌파하며 단기 반등을 시도 중이나, 60일 중기 저항선(₩ ${Math.round(sma60).toLocaleString()}) 부근의 매물대 소화가 진행되고 있습니다.`;
    } else if (!isAbove20 && !isAbove60 && !isGoldenCross) {
      trendSentence = `<strong>${stockTitleText}</strong>은(는) 20일선(₩ ${Math.round(sma20).toLocaleString()})과 60일선(₩ ${Math.round(sma60).toLocaleString()})이 데드크로스로 역배열된 하향 추세에 진입하여 단기 하방 압력이 가중된 상태입니다.`;
    } else {
      trendSentence = `<strong>${stockTitleText}</strong>은(는) 20일선(₩ ${Math.round(sma20).toLocaleString()})과 60일선(₩ ${Math.round(sma60).toLocaleString()}) 사이에서 5영업일 주가 변동률 ${momentum5d >= 0 ? '+' : ''}${momentum5d.toFixed(1)}%의 박스권 수렴을 거치며 방향성을 타진하고 있습니다.`;
    }

    // 2. Volume & RSI Momentum Sentence
    let avgVol20 = 1;
    if (rawData && rawData.length >= 20) {
      avgVol20 = rawData.slice(-20).reduce((sum, d) => sum + (d.volume || 0), 0) / 20;
    }
    const lastBar = rawData && rawData.length > 0 ? rawData[rawData.length - 1] : { volume: 0 };
    const volRatio = avgVol20 > 0 ? (lastBar.volume || 0) / avgVol20 : 1;

    let volDesc = '';
    if (volRatio >= 1.6) {
      volDesc = `평균 대비 <strong>${volRatio.toFixed(1)}배</strong>의 대량 거래량이 유입되며`;
    } else if (volRatio <= 0.6) {
      volDesc = `거래량이 감소한 채 건전한 숨고르기 양상을 보이며`;
    } else {
      volDesc = `안정적인 거래량 흐름 속에서`;
    }

    let rsiDesc = '';
    if (rsi < 30) {
      rsiDesc = `RSI(${rsi.toFixed(1)}) 과매도 침체권에 진입하여 기술적 반등 탄력이 높아지고 있습니다`;
    } else if (rsi <= 45) {
      rsiDesc = `RSI(${rsi.toFixed(1)}) 눌림목 반등 적정 구간에 위치하여 저가 매수세 유입이 기대됩니다`;
    } else if (rsi >= 70) {
      rsiDesc = `RSI(${rsi.toFixed(1)}) 단기 과열권에 도달하여 차익 실현 매물 출회에 주의가 요구됩니다`;
    } else {
      rsiDesc = `RSI(${rsi.toFixed(1)}) 중립 범위에서 균형을 이루고 있습니다`;
    }

    let indicatorSentence = `기술적으로는 ${volDesc} ${rsiDesc}. 최근 20일 최고가(₩ ${Math.round(recentHigh).toLocaleString()}) 대비 <strong>${dropFromHigh.toFixed(1)}%</strong>의 ${dropFromHigh <= -8 ? '깊은 가격 조정' : '적정 수준의 되돌림'}을 보인 상태입니다 (14일 ATR: ₩ ${Math.round(currentATR).toLocaleString()}).`;

    // 3. Quantitative Backtest & Action Plan Sentence with Framework
    let backtestSentence = '';
    if (trades && trades.length > 0) {
      const winCount = trades.filter(t => t.returnPct > 0).length;
      const winRate = ((winCount / trades.length) * 100).toFixed(1);
      const avgReturn = (trades.reduce((s, t) => s + t.returnPct, 0) / trades.length).toFixed(1);
      backtestSentence = `과거 백테스팅 분석 결과 총 <strong>${trades.length}회</strong>의 신호 중 <strong>${winCount}회</strong> 익절(승률 <strong>${winRate}%</strong>, 평균 손익률 <strong>${avgReturn >= 0 ? '+' : ''}${avgReturn}%</strong>)을 기록하였습니다. `;
    }

    let actionPlanSentence = '';
    if (direction === 'BULLISH') {
      actionPlanSentence = `정량 프레임워크 기준, <strong>예상 매수가 ₩ ${expectedEntry.toLocaleString()}</strong> 진입 시 손절 방어선은 1.5×ATR 변동성을 반영한 <strong>₩ ${stopLoss.toLocaleString()} (-${riskPct.toFixed(1)}%, 리스크 ₩ ${deltaRisk.toLocaleString()})</strong>입니다. 손익비 1:2.0 달성 지점인 <strong>1차 목표가 ₩ ${target1Price.toLocaleString()} (+${target1ChangePct.toFixed(1)}%)</strong>에서 50% 분할 익절하고, 잔여 수량은 전고점 및 <strong>2차 목표가 ₩ ${target2Price.toLocaleString()} (+${target2ChangePct.toFixed(1)}%)</strong>까지 추세 추종하는 전략이 유효합니다.`;
    } else if (direction === 'BEARISH') {
      actionPlanSentence = `하방 압력이 지속될 경우 <strong>하방 위험가 ₩ ${targetPrice.toLocaleString()} (${targetChangePct.toFixed(1)}%)</strong>까지 추가 이탈할 위험이 <strong>${100 - probScore}%</strong>에 달합니다. 1.5×ATR 방어선(₩ ${stopLoss.toLocaleString()}) 이탈 시 리스크 관리(비상 탈출 및 비중 축소)를 우선 권장합니다.`;
    } else {
      actionPlanSentence = `현재는 상·하방 수렴 중이므로, 20일선(₩ ${Math.round(sma20).toLocaleString()}) 안착 확인 후 <strong>₩ ${expectedEntry.toLocaleString()}</strong> 부근에서 1차 목표가 ₩ ${target1Price.toLocaleString()} / 손절선 ₩ ${stopLoss.toLocaleString()} 범위 내에서 보수적인 분할 진입을 권장합니다.`;
    }

    return `${trendSentence}<br><br>${indicatorSentence}<br><br>${backtestSentence}${actionPlanSentence}`;
  }

  // -------------------------------------------------------------
  // AI Multi-Directional Forecast Evaluation Engine (상승/하락/횡보)
  // -------------------------------------------------------------
  function evaluateMarketForecast(rawData, trades) {
    if (!rawData || rawData.length === 0) {
      return {
        direction: 'BULLISH',
        probScore: 70,
        targetPrice: 0,
        targetChangePct: 6.0,
        expectedEntry: 0,
        stopLoss: 0,
        deltaRisk: 0,
        riskPct: 3.0,
        target1Price: 0,
        target1ChangePct: 6.0,
        target2Price: 0,
        target2ChangePct: 10.5,
        currentATR: 0,
        swingHigh: 0,
        probLevel: '강력 눌림목 반등 구간',
        levelClass: 'level-strong-buy',
        reboundTag: '단기 반등 유효',
        forecastColor: '#00D992',
        forecastBg: 'rgba(0, 217, 146, 0.20)',
        forecastLabel: '⚡ AI 도약 반등 경로 (+6.0%)',
        commentary: '데이터 수집 대기 중입니다.',
        lastClose: 0,
        sma20: 0,
        sma60: 0,
        rsi: 50,
        tpPct: 6.0,
        slPct: 3.0,
        maxHoldDaysVal: 7
      };
    }

    const lastBar = rawData[rawData.length - 1];
    const lastClose = lastBar.close;
    const sma20 = lastBar.sma20 || lastClose;
    const sma60 = lastBar.sma60 || lastClose;
    const sma120 = lastBar.sma120 || sma60;
    const rsi = lastBar.rsi || 50;

    const tpPct = Number(takeProfitInput.value) || 6.0;
    const slPct = Number(stopLossInput.value) || 3.0;
    const maxHoldDaysVal = Number(maxHoldDaysInput.value) || 7;

    // Recent 20-day price action
    const recentSlice = rawData.slice(-20);
    const recentHigh = Math.max(...recentSlice.map(d => d.high || d.close));
    const recentLow = Math.min(...recentSlice.map(d => d.low || d.close));
    const dropFromHigh = ((lastClose - recentHigh) / recentHigh) * 100;
    const bounceFromLow = ((lastClose - recentLow) / recentLow) * 100;

    // 5-day short term momentum
    const prev5Bar = rawData[Math.max(0, rawData.length - 6)];
    const momentum5d = ((lastClose - prev5Bar.close) / prev5Bar.close) * 100;

    // Technical Factor Scoring (0 ~ 100)
    let bullishScore = 50;

    // 1. Trend & Moving Average Alignment
    const isAbove60 = lastClose >= sma60;
    const isAbove20 = lastClose >= sma20;
    const isGoldenCross = sma20 >= sma60;

    if (isAbove20 && isAbove60 && isGoldenCross) {
      bullishScore += 20; // Strong Bullish Alignment
    } else if (isAbove60 && isGoldenCross) {
      bullishScore += 10; // Pullback above 60MA support
    } else if (!isAbove20 && !isAbove60) {
      bullishScore -= 22; // Clear Downtrend (Trading below both 20MA and 60MA)
    }

    if (!isGoldenCross) {
      bullishScore -= 12; // Death Cross Resistance
    }

    // 2. RSI Indicator
    if (rsi >= 32 && rsi <= 46) {
      bullishScore += 14; // Ideal Dip Pullback Zone
    } else if (rsi < 30) {
      if (momentum5d >= 0) bullishScore += 10; // Oversold Bullish Divergence
      else bullishScore -= 10;                // Free-falling knife risk
    } else if (rsi >= 70) {
      bullishScore -= 24;                     // Peak Overbought Exhaustion (High drop risk)
    } else if (rsi >= 60) {
      bullishScore -= 8;
    }

    // 3. Drop Magnitude from 20-day High
    if (dropFromHigh <= -3.0 && dropFromHigh >= -10.0 && isAbove60) {
      bullishScore += 12; // Healthy dip
    } else if (dropFromHigh < -15.0) {
      bullishScore -= 14; // Severe breakdown
    }

    // 4. Backtest Win Rate Feedback
    if (trades && trades.length > 0) {
      const winTrades = trades.filter(t => t.returnPct > 0).length;
      const historicalWinRate = (winTrades / trades.length) * 100;
      bullishScore = Math.round(bullishScore * 0.45 + historicalWinRate * 0.55);
    }

    const probScore = Math.max(15, Math.min(95, bullishScore));

    let direction = 'BULLISH';
    let targetPrice = 0;
    let targetChangePct = 0;
    let probLevel = '';
    let levelClass = '';
    let reboundTag = '';
    let forecastColor = '#00D992';
    let forecastBg = 'rgba(0, 217, 146, 0.20)';
    let forecastLabel = '';

    // -------------------------------------------------------------
    // Quantitative Price Framework Calculation (정량적 산출 공식)
    // 1. 매수가 (P_buy): MA20 지지 반등 확인 종가 또는 이평선 근접가
    // 2. 손절가 (P_stop): P_buy - (1.5 * ATR14) (ATR 변동성 방어 방식 권장)
    // 3. 리스크 범위 (ΔRisk): P_buy - P_stop
    // 4. 1차 목표가 (P_target1): P_buy + (2.0 * ΔRisk) [손익비 1:2.0 정량 익절]
    // 5. 2차 목표가 (P_target2): max(P_buy + 3.0 * ΔRisk, Swing High 전고점)
    // -------------------------------------------------------------
    const currentATR = (lastBar && lastBar.atr) ? lastBar.atr : Math.round(lastClose * 0.025);

    // Swing High (최근 60거래일 전고점)
    const lookbackSwing = Math.min(60, rawData.length);
    const recentSwingSlice = rawData.slice(rawData.length - lookbackSwing);
    const swingHigh = Math.max(...recentSwingSlice.map(d => d.high || d.close));

    // 1) 매수가 (P_buy)
    let expectedEntry = Math.round(sma20 > 0 ? sma20 : lastClose);
    if (lastBar.close >= lastBar.open && isAbove20) {
      expectedEntry = lastClose; // 당일 양봉 전환 지지 종가 진입
    } else if (isAbove20 && Math.abs(lastClose - sma20) / sma20 <= 0.03) {
      expectedEntry = lastClose; // 20일선 근접가 진입
    }
    if (expectedEntry <= 0) expectedEntry = lastClose;

    // 2) 손절가 (P_stop - 방식 B ATR 1.5배 변동성 방어)
    let stopLoss = Math.round(expectedEntry - (1.5 * currentATR));
    // 방식 A 폴백 / 보정 (이평선 비율 방식 MA20 * (1 - delta) 또는 slPct)
    if (stopLoss >= expectedEntry || stopLoss <= 0) {
      stopLoss = Math.round(expectedEntry * (1 - (slPct || 3.0) / 100));
    }

    // 3) 리스크 범위 (ΔRisk)
    const deltaRisk = Math.max(Math.round(expectedEntry * 0.008), expectedEntry - stopLoss);
    const riskPct = ((expectedEntry - stopLoss) / expectedEntry) * 100;

    // 4) 1차 목표가 (P_target1 - 50% 분할 매도, 손익비 1:2.0)
    const target1Price = Math.round(expectedEntry + (2.0 * deltaRisk));
    const target1ChangePct = ((target1Price - expectedEntry) / expectedEntry) * 100;

    // 5) 2차 목표가 (P_target2 - 잔량 추세 매도, 손익비 1:3.0 또는 전고점)
    const target2Price = Math.max(Math.round(expectedEntry + (3.0 * deltaRisk)), Math.round(swingHigh));
    const target2ChangePct = ((target2Price - expectedEntry) / expectedEntry) * 100;

    const stockTitleText = chartSymbolName ? chartSymbolName.textContent : '해당 종목';
    let commentary = '';

    if (probScore >= 58) {
      // 🟢 [상승 반등 시나리오]
      direction = 'BULLISH';
      targetChangePct = target1ChangePct;
      targetPrice = target1Price;
      forecastColor = '#00D992';
      forecastBg = 'rgba(0, 217, 146, 0.20)';
      forecastLabel = `⚡ AI 도약 반등 경로 (1차 +${target1ChangePct.toFixed(1)}%)`;

      if (probScore >= 75) {
        probLevel = '강력 눌림목 반등 구간';
        levelClass = 'level-strong-buy';
        reboundTag = '단기 급반등 유효';
      } else {
        probLevel = '눌림목 도약 매수 적기';
        levelClass = 'level-buy';
        reboundTag = '추세 지지 반등 기대';
      }
    } else if (probScore < 45) {
      // 🔴 [하락 이탈 / 지지 붕괴 시나리오]
      direction = 'BEARISH';
      const expectedDropPct = Math.max(riskPct * 1.3, 4.5);
      targetChangePct = -expectedDropPct;
      targetPrice = Math.round(lastClose * (1 - expectedDropPct / 100));
      forecastColor = '#EF4444';
      forecastBg = 'rgba(239, 68, 68, 0.20)';
      forecastLabel = `🔻 AI 하방 이탈 위험 (-${expectedDropPct.toFixed(1)}%)`;

      if (probScore <= 32) {
        probLevel = '🔻 급락 경보 / 비중 축소';
        levelClass = 'level-caution';
        reboundTag = '하방 붕괴 위험 심화';
      } else {
        probLevel = '추세 이탈 주의 / 하방 압력';
        levelClass = 'level-caution';
        reboundTag = '추가 하락 주의';
      }
    } else {
      // 🟡 [중립 횡보 / 박스권 조정 시나리오]
      direction = 'NEUTRAL';
      const slightChange = target1ChangePct * 0.4;
      targetChangePct = slightChange;
      targetPrice = Math.round(lastClose * (1 + slightChange / 100));
      forecastColor = '#FB923C';
      forecastBg = 'rgba(251, 146, 60, 0.20)';
      forecastLabel = `⏸️ AI 횡보 지지 테스트 (±${riskPct.toFixed(1)}%)`;

      probLevel = '중립 관망 / 지지력 테스트';
      levelClass = 'level-neutral';
      reboundTag = '지지선 확인 필요';
    }

    // Dynamic Multi-Dimensional Tactical Commentary Generator
    commentary = generateTacticalCommentary({
      stockTitleText,
      lastClose,
      sma20,
      sma60,
      sma120,
      rsi,
      dropFromHigh,
      bounceFromLow,
      momentum5d,
      recentHigh,
      recentLow,
      targetPrice,
      targetChangePct,
      expectedEntry,
      stopLoss,
      deltaRisk,
      riskPct,
      target1Price,
      target1ChangePct,
      target2Price,
      target2ChangePct,
      currentATR,
      swingHigh,
      tpPct,
      slPct,
      maxHoldDaysVal,
      probScore,
      direction,
      trades,
      rawData
    });

    // Dynamic Action Guides for the 4 Tiles
    let entryAction = '';
    let tpAction = '';
    let slAction = '';
    let horizonAction = '';
    let actionClass = 'action-bullish';

    if (direction === 'BULLISH') {
      actionClass = 'action-bullish';
      entryAction = `<i class="fa-solid fa-crosshairs"></i> <span>1차 40% 분할 매수 대기</span>`;
      tpAction = `<i class="fa-solid fa-coins"></i> <span>1차 도달 시 50% 분할 익절</span>`;
      slAction = `<i class="fa-solid fa-ban"></i> <span>1.5×ATR 이탈 시 기계적 손절</span>`;
      horizonAction = `<i class="fa-solid fa-stopwatch"></i> <span>목표 도달 시 2차 트레일링</span>`;
    } else if (direction === 'BEARISH') {
      actionClass = 'action-bearish';
      entryAction = `<i class="fa-solid fa-triangle-exclamation"></i> <span>신규 매수 금지 / 하방 관망</span>`;
      tpAction = `<i class="fa-solid fa-arrow-trend-down"></i> <span>하방 이탈 시 잔여분 비중 축소</span>`;
      slAction = `<i class="fa-solid fa-skull-crossbones"></i> <span>붕괴 즉시 전량 비상 탈출</span>`;
      horizonAction = `<i class="fa-solid fa-shield"></i> <span>하락 추세 진정 시까지 대기</span>`;
    } else {
      actionClass = 'action-neutral';
      entryAction = `<i class="fa-solid fa-magnifying-glass"></i> <span>박스권 하단 지지 확인 후 진입</span>`;
      tpAction = `<i class="fa-solid fa-right-left"></i> <span>단기 저항선 부근 분할 매도</span>`;
      slAction = `<i class="fa-solid fa-shield-halved"></i> <span>박스 하단 이탈 시 원칙 청산</span>`;
      horizonAction = `<i class="fa-solid fa-hourglass-end"></i> <span>기간 내 미상승 시 타임컷</span>`;
    }

    return {
      direction,
      probScore,
      targetPrice,
      targetChangePct,
      expectedEntry,
      stopLoss,
      deltaRisk,
      riskPct,
      target1Price,
      target1ChangePct,
      target2Price,
      target2ChangePct,
      currentATR,
      swingHigh,
      probLevel,
      levelClass,
      reboundTag,
      forecastColor,
      forecastBg,
      forecastLabel,
      commentary,
      entryAction,
      tpAction,
      slAction,
      horizonAction,
      actionClass,
      lastClose,
      sma20,
      sma60,
      rsi,
      tpPct,
      slPct,
      maxHoldDaysVal
    };
  }

  // -------------------------------------------------------------
  // AI Live Blueprint HUD Renderer
  // -------------------------------------------------------------
  function renderLiveForecast(rawData, trades, forecast) {
    if (!rawData || rawData.length === 0 || !forecast) return;

    // 0. Update Stock Current Price & Daily Change (Clean "▲ 6,500 (+2.43%)" format)
    const stockCurrPrice = document.getElementById('stockCurrPrice');
    const stockPriceChange = document.getElementById('stockPriceChange');

    if (rawData && rawData.length > 0) {
      const n = rawData.length;
      const lastItem = rawData[n - 1];
      const prevItem = n >= 2 ? rawData[n - 2] : rawData[n - 1];
      const currentPrice = lastItem.close;
      const prevPrice = prevItem ? prevItem.close : currentPrice;
      const diff = currentPrice - prevPrice;
      const diffPct = prevPrice > 0 ? (diff / prevPrice) * 100 : 0;

      if (stockCurrPrice) {
        stockCurrPrice.textContent = `₩ ${Math.round(currentPrice).toLocaleString('ko-KR')}`;
      }

      if (stockPriceChange) {
        if (diff > 0) {
          stockPriceChange.className = 'stock-price-change is-up';
          stockPriceChange.textContent = `▲ ${Math.round(Math.abs(diff)).toLocaleString('ko-KR')} (+${diffPct.toFixed(2)}%)`;
        } else if (diff < 0) {
          stockPriceChange.className = 'stock-price-change is-down';
          stockPriceChange.textContent = `▼ ${Math.round(Math.abs(diff)).toLocaleString('ko-KR')} (${diffPct.toFixed(2)}%)`;
        } else {
          stockPriceChange.className = 'stock-price-change is-flat';
          stockPriceChange.textContent = `- 0 (0.00%)`;
        }
      }
    }

    const forecastProbBadge = document.getElementById('forecastProbBadge');
    const forecastProbVal = document.getElementById('forecastProbVal');
    const forecastProbLevel = document.getElementById('forecastProbLevel');

    const forecastEntryLabel = document.getElementById('forecastEntryLabel');
    const forecastEntryVal = document.getElementById('forecastEntryVal');
    const forecastEntryTag = document.getElementById('forecastEntryTag');
    const forecastTpIcon = document.getElementById('forecastTpIcon');
    const forecastTpLabel = document.getElementById('forecastTpLabel');
    const forecastTpVal = document.getElementById('forecastTpVal');
    const forecastTpPct = document.getElementById('forecastTpPct');
    const forecastSlLabel = document.getElementById('forecastSlLabel');
    const forecastSlVal = document.getElementById('forecastSlVal');
    const forecastSlPct = document.getElementById('forecastSlPct');
    const forecastHorizonVal = document.getElementById('forecastHorizonVal');
    const forecastReboundTag = document.getElementById('forecastReboundTag');
    const forecastCommentaryText = document.getElementById('forecastCommentaryText');

    const forecastEntryAction = document.getElementById('forecastEntryAction');
    const forecastTpAction = document.getElementById('forecastTpAction');
    const forecastSlAction = document.getElementById('forecastSlAction');
    const forecastHorizonAction = document.getElementById('forecastHorizonAction');

    if (forecastProbVal) forecastProbVal.textContent = `${forecast.probScore}%`;
    if (forecastProbLevel) forecastProbLevel.textContent = forecast.probLevel;
    if (forecastProbBadge) {
      forecastProbBadge.className = `forecast-prob-badge ${forecast.levelClass}`;
    }

    if (forecastEntryVal) forecastEntryVal.textContent = `₩ ${forecast.expectedEntry.toLocaleString()}`;
    if (forecastEntryLabel) forecastEntryLabel.textContent = forecast.direction === 'BEARISH' ? '예상 하방 지지선' : '예상 매수가';
    if (forecastEntryTag) forecastEntryTag.textContent = forecast.lastClose <= forecast.sma20 ? '20일선 하회 눌림' : '20일선 지지 반등';

    if (forecastTpLabel) {
      forecastTpLabel.textContent = forecast.direction === 'BEARISH' ? '하방 경보 목표가' : (forecast.direction === 'BULLISH' ? '1차 목표가 (1:2.0)' : '예상 횡보가');
    }
    if (forecastTpIcon) {
      if (forecast.direction === 'BEARISH') {
        forecastTpIcon.innerHTML = '<i class="fa-solid fa-arrow-trend-down text-rose"></i>';
      } else if (forecast.direction === 'BULLISH') {
        forecastTpIcon.innerHTML = '<i class="fa-solid fa-bullseye text-primary"></i>';
      } else {
        forecastTpIcon.innerHTML = '<i class="fa-solid fa-arrows-left-right text-amber"></i>';
      }
    }
    if (forecastTpVal) {
      forecastTpVal.textContent = `₩ ${forecast.targetPrice.toLocaleString()}`;
      forecastTpVal.className = `pill-val ${forecast.direction === 'BEARISH' ? 'text-rose' : (forecast.direction === 'BULLISH' ? 'text-cobalt' : 'text-amber')}`;
    }
    if (forecastTpPct) {
      if (forecast.direction === 'BULLISH' && forecast.target2Price) {
        forecastTpPct.textContent = `+${forecast.targetChangePct.toFixed(1)}% (2차: ₩${forecast.target2Price.toLocaleString()})`;
      } else {
        forecastTpPct.textContent = `${forecast.targetChangePct >= 0 ? '+' : ''}${forecast.targetChangePct.toFixed(1)}%`;
      }
      forecastTpPct.className = `pill-sub ${forecast.direction === 'BEARISH' ? 'text-rose' : (forecast.direction === 'BULLISH' ? 'text-cobalt' : 'text-amber')}`;
    }

    if (forecastSlLabel) {
      forecastSlLabel.textContent = '손절 방어선 (1.5 ATR)';
    }
    if (forecastSlVal) forecastSlVal.textContent = `₩ ${forecast.stopLoss.toLocaleString()}`;
    if (forecastSlPct) {
      const riskVal = forecast.riskPct !== undefined ? forecast.riskPct : forecast.slPct;
      forecastSlPct.textContent = `-${riskVal.toFixed(1)}% (리스크: ₩${(forecast.deltaRisk || 0).toLocaleString()})`;
    }

    if (forecastHorizonVal) forecastHorizonVal.textContent = `${Math.max(2, Math.round(forecast.maxHoldDaysVal * 0.5))}~${forecast.maxHoldDaysVal}일`;
    if (forecastReboundTag) {
      forecastReboundTag.textContent = forecast.reboundTag;
      forecastReboundTag.className = `pill-sub ${forecast.direction === 'BEARISH' ? 'text-rose' : (forecast.direction === 'BULLISH' ? 'text-emerald' : 'text-amber')}`;
    }

    if (forecastEntryAction) {
      forecastEntryAction.innerHTML = forecast.entryAction;
      forecastEntryAction.className = `pill-action-guide ${forecast.actionClass}`;
    }
    if (forecastTpAction) {
      forecastTpAction.innerHTML = forecast.tpAction;
      forecastTpAction.className = `pill-action-guide ${forecast.actionClass}`;
    }
    if (forecastSlAction) {
      forecastSlAction.innerHTML = forecast.slAction;
      forecastSlAction.className = `pill-action-guide ${forecast.actionClass}`;
    }
    if (forecastHorizonAction) {
      forecastHorizonAction.innerHTML = forecast.horizonAction;
      forecastHorizonAction.className = `pill-action-guide ${forecast.actionClass}`;
    }

    if (forecastCommentaryText) {
      forecastCommentaryText.innerHTML = forecast.commentary;
    }
  }

  // -------------------------------------------------------------
  // UI Metric Updates (Pill KPIs & Modal Stats)
  // -------------------------------------------------------------
  function updateMetrics(initialCapital, finalBalance, trades, equityCurve, buyHoldEquity, rawData) {
    const totalReturnPct = ((finalBalance - initialCapital) / initialCapital) * 100;
    
    kpiTotalReturn.textContent = `${totalReturnPct >= 0 ? '+' : ''}${totalReturnPct.toFixed(2)}%`;
    kpiTotalReturn.className = `pill-val ${totalReturnPct >= 0 ? 'text-emerald' : 'text-rose'}`;
    kpiFinalBalance.textContent = `₩ ${Math.round(finalBalance).toLocaleString()}`;

    const wins = trades.filter(t => t.returnPct > 0);
    const losses = trades.filter(t => t.returnPct <= 0);
    const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;

    const totalWinVal = wins.reduce((acc, t) => acc + t.returnPct, 0);
    const totalLossVal = Math.abs(losses.reduce((acc, t) => acc + t.returnPct, 0));
    const profitFactor = totalLossVal > 0 ? totalWinVal / totalLossVal : (totalWinVal > 0 ? 99.9 : 0);
    const avgReturn = trades.length > 0 ? trades.reduce((acc, t) => acc + t.returnPct, 0) / trades.length : 0;

    kpiWinRate.textContent = `${winRate.toFixed(1)}%`;
    kpiWinCount.textContent = `${wins.length}승 ${losses.length}패`;

    kpiProfitFactor.textContent = profitFactor.toFixed(2);
    kpiAvgReturn.textContent = `평균 ${avgReturn >= 0 ? '+' : ''}${avgReturn.toFixed(2)}%`;

    // Maximum Drawdown (MDD) calculation
    let maxPeak = equityCurve[0];
    let maxDrawdown = 0;
    for (let eq of equityCurve) {
      if (eq > maxPeak) maxPeak = eq;
      const dd = (maxPeak - eq) / maxPeak;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }

    kpiMDD.textContent = `-${(maxDrawdown * 100).toFixed(2)}%`;
    kpiTradeCount.textContent = `총 ${trades.length}회`;
    headerTradeCount.textContent = trades.length;

    // Equity Modal summary values
    const finalBhBalance = buyHoldEquity[buyHoldEquity.length - 1] || initialCapital;
    const bhReturnPct = ((finalBhBalance - initialCapital) / initialCapital) * 100;
    const alphaPct = ((finalBalance - finalBhBalance) / initialCapital) * 100;

    const stockTitle = chartSymbolName ? chartSymbolName.textContent : '현재 분석 종목';

    const modalStockBadge = document.getElementById('modalStockBadge');
    const modalInitialCapital = document.getElementById('modalInitialCapital');
    if (modalStockBadge) {
      modalStockBadge.textContent = stockTitle;
    }
    if (modalInitialCapital) {
      modalInitialCapital.textContent = `₩ ${Math.round(initialCapital).toLocaleString()}`;
    }
    if (modalFinalBalance) {
      modalFinalBalance.textContent = `₩ ${Math.round(finalBalance).toLocaleString()} (${totalReturnPct >= 0 ? '+' : ''}${totalReturnPct.toFixed(2)}%)`;
      modalFinalBalance.className = `eq-kpi-value ${totalReturnPct >= 0 ? 'text-emerald' : 'text-rose'}`;
    }
    if (modalBuyHoldBalance) {
      modalBuyHoldBalance.textContent = `₩ ${Math.round(finalBhBalance).toLocaleString()} (${bhReturnPct >= 0 ? '+' : ''}${bhReturnPct.toFixed(2)}%)`;
      modalBuyHoldBalance.className = `eq-kpi-value ${bhReturnPct >= 0 ? 'text-emerald' : 'text-rose'}`;
    }
    if (modalAlpha) {
      modalAlpha.textContent = `${alphaPct >= 0 ? '+' : ''}${alphaPct.toFixed(2)}%`;
      modalAlpha.className = `eq-kpi-value ${alphaPct >= 0 ? 'text-emerald' : 'text-rose'}`;
    }

    // Save latest simulation equity data for modal rendering
    latestEquityData = {
      stockTitle: stockTitle,
      labels: rawData ? rawData.map(d => d.date) : [],
      equityCurve: equityCurve,
      buyHoldEquity: buyHoldEquity,
      initialCapital: initialCapital,
      finalBalance: finalBalance,
      finalBhBalance: finalBhBalance,
      totalReturnPct: totalReturnPct,
      bhReturnPct: bhReturnPct,
      alphaPct: alphaPct
    };

    // If modal is currently open, refresh chart in real-time
    if (equityModal && equityModal.style.display === 'flex') {
      renderEquityModalChart();
    }

    // Update real-time counts on chart legend filter buttons
    updateLegendSignalCounts(trades);
  }

  // -------------------------------------------------------------
  // Filter Tabs & Trade Log Table Rendering
  // -------------------------------------------------------------
  function updateLegendSignalCounts(trades) {
    const buyCount = trades.length;
    const tpCount = trades.filter(t => t.badgeClass === 'badge-tp' || t.reason === 'Take Profit').length;
    const slCount = trades.filter(t => t.badgeClass === 'badge-sl' || t.reason === 'Stop Loss').length;
    const tsCount = trades.filter(t => t.badgeClass === 'badge-ts' || t.reason === 'Trailing Stop').length;
    const tcCount = trades.filter(t => t.badgeClass === 'badge-tc' || t.reason === 'Time Cut').length;

    const elBuy = document.getElementById('legendBuyCount');
    const elTp = document.getElementById('legendTpCount');
    const elSl = document.getElementById('legendSlCount');
    const elTs = document.getElementById('legendTsCount');
    const elTc = document.getElementById('legendTcCount');

    if (elBuy) elBuy.textContent = buyCount;
    if (elTp) elTp.textContent = tpCount;
    if (elSl) elSl.textContent = slCount;
    if (elTs) elTs.textContent = tsCount;
    if (elTc) elTc.textContent = tcCount;
  }

  function updateFilterTabCounts(trades) {
    filterAllCount.textContent = trades.length;
    filterTpCount.textContent = trades.filter(t => t.badgeClass === 'badge-tp' || t.reason === 'Take Profit').length;
    filterSlCount.textContent = trades.filter(t => t.badgeClass === 'badge-sl' || t.reason === 'Stop Loss').length;
    filterTsCount.textContent = trades.filter(t => t.badgeClass === 'badge-ts' || t.reason === 'Trailing Stop').length;
    filterTcCount.textContent = trades.filter(t => t.badgeClass === 'badge-tc' || t.reason === 'Time Cut').length;
  }

  function renderFilteredTrades() {
    let filtered = currentTrades;
    if (currentActiveFilter === 'tp') {
      filtered = currentTrades.filter(t => t.badgeClass === 'badge-tp' || t.reason === 'Take Profit');
    } else if (currentActiveFilter === 'sl') {
      filtered = currentTrades.filter(t => t.badgeClass === 'badge-sl' || t.reason === 'Stop Loss');
    } else if (currentActiveFilter === 'ts') {
      filtered = currentTrades.filter(t => t.badgeClass === 'badge-ts' || t.reason === 'Trailing Stop');
    } else if (currentActiveFilter === 'tc') {
      filtered = currentTrades.filter(t => t.badgeClass === 'badge-tc' || t.reason === 'Time Cut');
    }

    logCountSpan.textContent = `총 ${filtered.length}건 / ${currentTrades.length}건`;

    if (filtered.length === 0) {
      tradeLogBody.innerHTML = `<tr><td colspan="8" class="empty-msg">해당 조건의 거래 내역이 없습니다.</td></tr>`;
      return;
    }

    tradeLogBody.innerHTML = filtered.slice().reverse().map(t => {
      let icon = '';
      let displayReason = t.reason;
      if (t.badgeClass === 'badge-tp' || t.reason === 'Take Profit') {
        icon = '<span class="legend-shape shape-diamond" style="transform:rotate(45deg);vertical-align:middle;margin-right:4px;"></span>';
        displayReason = '익절 (TP)';
      } else if (t.badgeClass === 'badge-sl' || t.reason === 'Stop Loss') {
        icon = '<span class="legend-shape shape-cross" style="vertical-align:middle;margin-right:4px;"></span>';
        displayReason = '손절 (SL)';
      } else if (t.badgeClass === 'badge-ts' || t.reason === 'Trailing Stop') {
        icon = '<span class="legend-shape shape-triangle" style="vertical-align:middle;margin-right:4px;"></span>';
        displayReason = '트레일링 (TS)';
      } else if (t.badgeClass === 'badge-tc' || t.reason === 'Time Cut') {
        icon = '<span class="legend-shape shape-square" style="vertical-align:middle;margin-right:4px;"></span>';
        displayReason = '타임컷 (TC)';
      }

      return `
        <tr>
          <td>${t.id}</td>
          <td>${t.entryDate}</td>
          <td>₩${t.entryPrice.toLocaleString()}</td>
          <td>${t.exitDate}</td>
          <td>₩${t.exitPrice.toLocaleString()}</td>
          <td>${t.holdDays}일</td>
          <td class="${t.returnPct >= 0 ? 'text-emerald' : 'text-rose'}" style="font-weight:700">
            ${t.returnPct >= 0 ? '+' : ''}${t.returnPct.toFixed(2)}%
          </td>
          <td><span class="reason-badge ${t.badgeClass}">${icon} ${displayReason}</span></td>
        </tr>
      `;
    }).join('');
  }

  // -------------------------------------------------------------
  // Dynamic Vector Marker Generator & Scaler for Chart.js Points
  // -------------------------------------------------------------
  let currentActiveSignal = 'ALL';

  const MA_DATASET_MAP = {
    '5': 1,
    '20': 2,
    '60': 3,
    '120': 4
  };

  const SIGNAL_DATASET_MAP = {
    BUY: 5,
    TP: 6,
    SL: 7,
    TS: 8,
    TC: 9
  };

  const FORECAST_DATASET_IDX = 10;

  const SIGNAL_BASE_CONFIG = {
    BUY: {
      pointStyle: 'circle',
      pointBackgroundColor: '#FF2E63', // Neon Coral Red Core
      pointBorderColor: '#00D992',     // Electric Green Halo Ring
      pointBorderWidth: 2.5
    },
    TP: {
      pointStyle: 'rectRot',           // Luminous Diamond (다이아몬드)
      pointBackgroundColor: '#00FF9D', // Ultra Electric Neon Green Core
      pointBorderColor: '#FFFFFF',     // Crisp White Ring
      pointBorderWidth: 2.5
    },
    SL: {
      pointStyle: 'crossRot',          // X-Cross Mark (손절 엑스)
      pointBackgroundColor: '#EF4444', // Vivid Crimson Core
      pointBorderColor: '#FFFFFF',     // Clean White Ring
      pointBorderWidth: 3.0
    },
    TS: {
      pointStyle: 'triangle',          // Upward Triangle (삼각)
      pointBackgroundColor: '#A855F7', // Electric Violet Core
      pointBorderColor: '#00D992',     // Electric Green Halo Ring
      pointBorderWidth: 2.5
    },
    TC: {
      pointStyle: 'rect',              // Solid Square (정사각)
      pointBackgroundColor: '#FB923C', // High-Voltage Orange Core
      pointBorderColor: '#FFFFFF',     // Crisp White Ring
      pointBorderWidth: 2.5
    }
  };

  function applyLegendSignalFilter(signalKey) {
    currentActiveSignal = signalKey;

    // Update UI legend buttons
    document.querySelectorAll('.legend-filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.signal === currentActiveSignal);
    });

    if (!priceChartInstance) return;

    const signals = ['BUY', 'TP', 'SL', 'TS', 'TC'];
    signals.forEach(sig => {
      const idx = SIGNAL_DATASET_MAP[sig];
      const dataset = priceChartInstance.data.datasets[idx];
      if (!dataset) return;

      if (currentActiveSignal === 'ALL' || currentActiveSignal === sig) {
        dataset.hidden = false;
      } else {
        dataset.hidden = true;
      }
    });

    updateDynamicMarkerScale(priceChartInstance);
    priceChartInstance.update('none');
  }

  // -------------------------------------------------------------
  // Dynamic Marker Scale on Zoom & Pan
  // -------------------------------------------------------------
  function updateDynamicMarkerScale(chart) {
    if (!chart || !chart.scales || !chart.scales.x) return;
    const minVal = chart.scales.x.min;
    const maxVal = chart.scales.x.max;
    const labels = chart.data.labels;
    if (!labels || labels.length === 0) return;

    let minIndex = 0;
    let maxIndex = labels.length - 1;

    if (typeof minVal === 'number') {
      minIndex = Math.max(0, Math.min(labels.length - 1, minVal));
    } else if (typeof minVal === 'string') {
      const idx = labels.indexOf(minVal);
      if (idx !== -1) minIndex = idx;
    }

    if (typeof maxVal === 'number') {
      maxIndex = Math.max(0, Math.min(labels.length - 1, maxVal));
    } else if (typeof maxVal === 'string') {
      const idx = labels.indexOf(maxVal);
      if (idx !== -1) maxIndex = idx;
    }

    const visibleBars = Math.max(1, maxIndex - minIndex + 1);

    // Dynamic marker size scaling based on zoom level
    let baseRadius = 4.8;
    if (visibleBars <= 15) {
      baseRadius = 10.5;
    } else if (visibleBars <= 25) {
      baseRadius = 8.8;
    } else if (visibleBars <= 45) {
      baseRadius = 6.8;
    } else if (visibleBars <= 80) {
      baseRadius = 5.2;
    } else if (visibleBars <= 150) {
      baseRadius = 3.6;
    } else if (visibleBars <= 280) {
      baseRadius = 2.4;
    } else {
      baseRadius = 1.6;
    }

    const isFiltered = (currentActiveSignal !== 'ALL');
    const signals = ['BUY', 'TP', 'SL', 'TS', 'TC'];

    signals.forEach(sig => {
      const idx = SIGNAL_DATASET_MAP[sig];
      const dataset = chart.data.datasets[idx];
      if (!dataset) return;

      if (!isFiltered) {
        dataset.pointRadius = baseRadius;
        dataset.pointHoverRadius = Math.max(baseRadius * 1.6, 5.5);
        dataset.pointBorderWidth = baseRadius >= 5.0 ? 2.8 : 2.0;
      } else if (currentActiveSignal === sig) {
        dataset.pointRadius = Math.max(baseRadius * 1.6, 6.0);
        dataset.pointHoverRadius = Math.max(baseRadius * 2.2, 8.5);
        dataset.pointBorderWidth = baseRadius >= 5.0 ? 3.5 : 2.6;
      }
    });

    // Also dynamically scale the forecast path points
    const forecastDataset = chart.data.datasets[FORECAST_DATASET_IDX];
    if (forecastDataset) {
      forecastDataset.pointRadius = Math.max(3.5, baseRadius * 0.9);
      forecastDataset.pointHoverRadius = Math.max(5.5, baseRadius * 1.4);
    }
  }

  // -------------------------------------------------------------
  // Candlestick (봉차트) Plugin & Chart Type Controller
  // -------------------------------------------------------------
  let currentChartType = 'candle'; // Default: 'candle' | 'line'

  // 1. Candlestick Renderer (Refined depth with 1px border & 40% translucent fill)
  const candlestickPlugin = {
    id: 'candlestickRenderer',
    beforeDatasetsDraw(chart) {
      if (currentChartType !== 'candle') return;
      const ohlcData = chart.options && chart.options._ohlcData;
      if (!ohlcData || !ohlcData.length) return;
      if (!chart.scales || !chart.scales.x || !chart.scales.y || !chart.chartArea || !chart.ctx) return;

      const { ctx, chartArea, scales } = chart;
      const x = scales.x;
      const y = scales.y;
      if (!x || !y) return;

      ctx.save();
      try {
        ctx.beginPath();
        ctx.rect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
        ctx.clip();

        const minVal = x.min;
        const maxVal = x.max;
        const labels = x.getLabels ? x.getLabels() : chart.data.labels;
        const minIdx = typeof minVal === 'number' ? minVal : (labels ? labels.indexOf(minVal) : 0);
        const maxIdx = typeof maxVal === 'number' ? maxVal : (labels ? labels.indexOf(maxVal) : ohlcData.length - 1);
        const visibleCount = Math.max(1, (maxIdx >= 0 && minIdx >= 0 ? maxIdx - minIdx + 1 : (labels ? labels.length : ohlcData.length)));

        const rawBarWidth = ((chartArea.right - chartArea.left) / visibleCount) * 0.72;
        const candleWidth = Math.max(2.0, Math.min(rawBarWidth, 24));
        const wickWidth = Math.max(1.0, Math.min(candleWidth * 0.15, 2.0));

        // KRX Standard with Refined Depth:
        // Yangbong (양봉: Close >= Open): Rose Crimson fill (0.40) + Solid #EF4444 stroke
        // Eumbong (음봉: Close < Open): Electric Cyan fill (0.40) + Solid #38BDF8 stroke
        const bullFill = 'rgba(239, 68, 68, 0.40)';
        const bullStroke = '#EF4444';
        const bearFill = 'rgba(56, 189, 248, 0.40)';
        const bearStroke = '#38BDF8';

        for (let i = 0; i < ohlcData.length; i++) {
          const d = ohlcData[i];
          if (!d || d.open === undefined || d.high === undefined) continue;

          const xPixel = x.getPixelForValue(i);
          if (xPixel < chartArea.left - 25 || xPixel > chartArea.right + 25) continue;

          const open = d.open;
          const high = d.high;
          const low = d.low;
          const close = d.close;

          const yOpen = y.getPixelForValue(open);
          const yHigh = y.getPixelForValue(high);
          const yLow = y.getPixelForValue(low);
          const yClose = y.getPixelForValue(close);

          const isBullish = close >= open;
          const strokeColor = isBullish ? bullStroke : bearStroke;
          const fillColor = isBullish ? bullFill : bearFill;

          // 1. High-Low Wick line
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = wickWidth;
          ctx.beginPath();
          ctx.moveTo(xPixel, yHigh);
          ctx.lineTo(xPixel, yLow);
          ctx.stroke();

          // 2. Open-Close Body rectangle (Fill + Crisp Border)
          const topY = Math.min(yOpen, yClose);
          const bodyHeight = Math.max(Math.abs(yClose - yOpen), 1.5);

          ctx.fillStyle = fillColor;
          ctx.fillRect(xPixel - candleWidth / 2, topY, candleWidth, bodyHeight);

          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 1.0;
          ctx.strokeRect(xPixel - candleWidth / 2, topY, candleWidth, bodyHeight);
        }
      } catch (err) {
        console.error('Candlestick render error:', err);
      } finally {
        ctx.restore();
      }
    }
  };

  // 2. Marker Halo / Isolation Shield Plugin (Isolates dots 100% from underlying candles)
  const markerHaloPlugin = {
    id: 'markerHaloRenderer',
    beforeDatasetsDraw(chart) {
      if (!chart.scales || !chart.scales.x || !chart.scales.y || !chart.data || !chart.data.datasets || !chart.ctx) return;
      const { ctx, chartArea, scales, data } = chart;
      const x = scales.x;
      const y = scales.y;
      if (!x || !y) return;

      const signals = Object.values(SIGNAL_DATASET_MAP); // Dynamic signal indices: BUY, TP, SL, TS, TC
      ctx.save();
      try {
        if (chartArea) {
          ctx.beginPath();
          ctx.rect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
          ctx.clip();
        }

        signals.forEach(idx => {
          const dataset = data.datasets[idx];
          if (!dataset || dataset.hidden || !dataset.data) return;

          const radius = (dataset.pointRadius || 4.8) + 3.2;

          for (let i = 0; i < dataset.data.length; i++) {
            const val = dataset.data[i];
            if (val === null || val === undefined) continue;

            const xPix = x.getPixelForValue(i);
            const yPix = y.getPixelForValue(val);

            // Draw dark background separation shield + neon glow
            ctx.beginPath();
            ctx.arc(xPix, yPix, radius, 0, Math.PI * 2);
            ctx.fillStyle = '#101010';
            ctx.shadowColor = 'rgba(0, 217, 146, 0.85)';
            ctx.shadowBlur = 8;
            ctx.fill();
          }
        });
      } catch (err) {
        console.error('Marker halo render error:', err);
      } finally {
        ctx.restore();
      }
    }
  };

  Chart.register(candlestickPlugin, markerHaloPlugin);

  // -------------------------------------------------------------
  // Chart.js Visualization (Voltagent Dark Candlestick & Signals)
  // -------------------------------------------------------------
  let currentChartSymbol = null;
  let currentChartDays = null;

  function renderCharts(rawData, buyHoldEquity, equityCurve, buyMarkers, tpMarkers, slMarkers, tsMarkers, tcMarkers, symbol, numDays, forecast) {
    const labels = rawData.map(d => d.date);
    const closePrices = rawData.map(d => d.close);
    const sma5Prices = rawData.map(d => d.sma5);
    const sma20Prices = rawData.map(d => d.sma20);
    const sma60Prices = rawData.map(d => d.sma60);
    const sma120Prices = rawData.map(d => d.sma120);

    // AI Forecast Projection Curve Data Calculation (Bullish vs Bearish vs Neutral)
    const lastClose = closePrices[closePrices.length - 1];
    const targetPrice = (forecast && forecast.targetPrice) ? forecast.targetPrice : Math.round(lastClose * 1.06);

    // Future empty right space: 20 trading days (20거래일 우측 빈 공간 여백)
    const FUTURE_DAYS = 20;
    const futureLabels = [];
    const lastDateStr = labels[labels.length - 1] || new Date().toISOString().split('T')[0];
    let curDate = new Date(lastDateStr);
    while (futureLabels.length < FUTURE_DAYS) {
      curDate.setDate(curDate.getDate() + 1);
      const dayOfWeek = curDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Weekdays only
        const m = String(curDate.getMonth() + 1).padStart(2, '0');
        const d = String(curDate.getDate()).padStart(2, '0');
        const dNum = futureLabels.length + 1;
        futureLabels.push(`${m}/${d}(D+${dNum})`);
      }
    }

    const extendedLabels = [...labels, ...futureLabels];
    const futurePads = Array(FUTURE_DAYS).fill(null);
    const paddedClosePrices = [...closePrices, ...futurePads];
    const paddedSma5 = [...sma5Prices, ...futurePads];
    const paddedSma20 = [...sma20Prices, ...futurePads];
    const paddedSma60 = [...sma60Prices, ...futurePads];
    const paddedSma120 = [...sma120Prices, ...futurePads];
    const paddedBuy = [...buyMarkers, ...futurePads];
    const paddedTp = [...tpMarkers, ...futurePads];
    const paddedSl = [...slMarkers, ...futurePads];
    const paddedTs = [...tsMarkers, ...futurePads];
    const paddedTc = [...tcMarkers, ...futurePads];
    const paddedHighs = [...rawData.map(d => d.high), ...futurePads];
    const paddedLows = [...rawData.map(d => d.low), ...futurePads];

    let forecastStep1, forecastStep2, forecastStep3, forecastStep4, forecastStep5;
    if (forecast && forecast.direction === 'BULLISH') {
      forecastStep1 = Math.round(lastClose + (targetPrice - lastClose) * 0.28);
      forecastStep2 = Math.round(lastClose + (targetPrice - lastClose) * 0.58);
      forecastStep3 = Math.round(lastClose + (targetPrice - lastClose) * 0.82);
      forecastStep4 = targetPrice;
      forecastStep5 = targetPrice;
    } else if (forecast && forecast.direction === 'BEARISH') {
      forecastStep1 = Math.round(lastClose + (targetPrice - lastClose) * 0.30);
      forecastStep2 = Math.round(lastClose + (targetPrice - lastClose) * 0.62);
      forecastStep3 = Math.round(lastClose + (targetPrice - lastClose) * 0.85);
      forecastStep4 = targetPrice;
      forecastStep5 = targetPrice;
    } else {
      forecastStep1 = Math.round(lastClose * (1 - 0.005));
      forecastStep2 = Math.round(lastClose * 1.002);
      forecastStep3 = Math.round(lastClose * (1 - 0.003));
      forecastStep4 = targetPrice;
      forecastStep5 = targetPrice;
    }
    const forecastData = Array(labels.length - 1).fill(null).concat([
      lastClose, forecastStep1, forecastStep2, forecastStep3, forecastStep4, forecastStep5,
      ...Array(Math.max(0, FUTURE_DAYS - 5)).fill(null)
    ]);

    // Calculate dynamic Y-axis min/max price range tailored specifically to this stock & scenario
    const validHighs = rawData.map(d => d.high).filter(v => typeof v === 'number' && !isNaN(v) && v > 0);
    const validLows = rawData.map(d => d.low).filter(v => typeof v === 'number' && !isNaN(v) && v > 0);
    const minPrice = validLows.length > 0 ? Math.min(...validLows, targetPrice) : Math.min(lastClose * 0.8, targetPrice);
    const maxPrice = validHighs.length > 0 ? Math.max(...validHighs, targetPrice) : Math.max(lastClose * 1.2, targetPrice);
    const yPadding = (maxPrice - minPrice) * 0.08 || minPrice * 0.05;
    const stockYMin = Math.max(0, Math.floor(minPrice - yPadding));
    const stockYMax = Math.ceil(maxPrice + yPadding);

    const isSameStockAndTimeframe = priceChartInstance && 
      currentChartSymbol === symbol && 
      currentChartDays === numDays &&
      priceChartInstance.data && 
      priceChartInstance.data.labels && 
      priceChartInstance.data.labels.length === extendedLabels.length &&
      priceChartInstance.data.labels[0] === extendedLabels[0];

    if (isSameStockAndTimeframe) {
      priceChartInstance.options._ohlcData = rawData;
      priceChartInstance.options.scales.y.suggestedMin = stockYMin;
      priceChartInstance.options.scales.y.suggestedMax = stockYMax;

      // Update moving averages (datasets 1~4)
      priceChartInstance.data.datasets[1].data = paddedSma5;
      priceChartInstance.data.datasets[2].data = paddedSma20;
      priceChartInstance.data.datasets[3].data = paddedSma60;
      priceChartInstance.data.datasets[4].data = paddedSma120;

      // Update strategy signal dots (datasets 5~9) and forecast curve (dataset 10)
      priceChartInstance.data.datasets[5].data = paddedBuy;
      priceChartInstance.data.datasets[6].data = paddedTp;
      priceChartInstance.data.datasets[7].data = paddedSl;
      priceChartInstance.data.datasets[8].data = paddedTs;
      priceChartInstance.data.datasets[9].data = paddedTc;
      
      // Update forecast line data, label, and colors dynamically
      if (forecast) {
        priceChartInstance.data.datasets[10].data = forecastData;
        priceChartInstance.data.datasets[10].label = forecast.forecastLabel;
        priceChartInstance.data.datasets[10].borderColor = forecast.forecastColor;
        priceChartInstance.data.datasets[10].backgroundColor = forecast.forecastBg;
        priceChartInstance.data.datasets[10].pointBackgroundColor = forecast.forecastColor;
      }

      // Apply current legend filter and scaling without resetting zoom/pan
      applyLegendSignalFilter(currentActiveSignal);
      updateDynamicMarkerScale(priceChartInstance);
      priceChartInstance.update('none');

      // Update Equity Modal chart if modal is currently open
      if (equityModal && equityModal.style.display === 'flex') {
        renderEquityModalChart();
      }
      return;
    }

    // Save active stock and timeframe tracker
    currentChartSymbol = symbol;
    currentChartDays = numDays;

    // Check MA buttons active states from UI
    const btn5 = document.querySelector('.legend-ma-tag.ma-btn[data-ma="5"]');
    const btn20 = document.querySelector('.legend-ma-tag.ma-btn[data-ma="20"]');
    const btn60 = document.querySelector('.legend-ma-tag.ma-btn[data-ma="60"]');
    const btn120 = document.querySelector('.legend-ma-tag.ma-btn[data-ma="120"]');

    const hide5 = btn5 ? !btn5.classList.contains('active') : true;
    const hide20 = btn20 ? !btn20.classList.contains('active') : false;
    const hide60 = btn60 ? !btn60.classList.contains('active') : false;
    const hide120 = btn120 ? !btn120.classList.contains('active') : false;

    // 1. Price & Signal Chart Initial Render (Only on New Stock / Timeframe)
    const ctxPrice = document.getElementById('priceChart').getContext('2d');
    if (priceChartInstance) priceChartInstance.destroy();

    const totalBars = extendedLabels.length;
    const defaultVisibleDataDays = 125; // 기본 뷰 기간: 최근 6개월 (약 125 거래일) + 20거래일 우측 빈 공간
    const minIndex = Math.max(0, totalBars - defaultVisibleDataDays - FUTURE_DAYS);
    const initialMinLabel = extendedLabels[minIndex];
    const initialMaxLabel = extendedLabels[totalBars - 1];

    priceChartInstance = new Chart(ctxPrice, {
      type: 'line',
      data: {
        labels: extendedLabels,
        datasets: [
          {
            label: '실제 종가 (Close)',
            data: paddedClosePrices,
            borderColor: currentChartType === 'candle' ? 'transparent' : '#FFFFFF',
            borderWidth: currentChartType === 'candle' ? 0 : 1.8,
            pointRadius: 0,
            tension: 0.1,
            showLine: currentChartType !== 'candle'
          },
          {
            label: '5일선 (SMA5)',
            data: paddedSma5,
            borderColor: '#94A3B8',
            borderWidth: 1.2,
            pointRadius: 0,
            hidden: hide5
          },
          {
            label: '20일선 (SMA20)',
            data: paddedSma20,
            borderColor: '#FB923C',
            borderWidth: 1.5,
            pointRadius: 0,
            hidden: hide20
          },
          {
            label: '60일선 (SMA60)',
            data: paddedSma60,
            borderColor: '#00D992',
            borderWidth: 1.5,
            pointRadius: 0,
            hidden: hide60
          },
          {
            label: '120일선 (SMA120)',
            data: paddedSma120,
            borderColor: '#A855F7',
            borderWidth: 1.5,
            pointRadius: 0,
            hidden: hide120
          },
          {
            label: '매수 (Buy)',
            data: paddedBuy,
            pointStyle: SIGNAL_BASE_CONFIG.BUY.pointStyle,
            pointBackgroundColor: SIGNAL_BASE_CONFIG.BUY.pointBackgroundColor,
            pointBorderColor: SIGNAL_BASE_CONFIG.BUY.pointBorderColor,
            pointBorderWidth: SIGNAL_BASE_CONFIG.BUY.pointBorderWidth,
            pointRadius: 4.2,
            pointHoverRadius: 6.5,
            showLine: false
          },
          {
            label: '익절 (TP)',
            data: paddedTp,
            pointStyle: SIGNAL_BASE_CONFIG.TP.pointStyle,
            pointBackgroundColor: SIGNAL_BASE_CONFIG.TP.pointBackgroundColor,
            pointBorderColor: SIGNAL_BASE_CONFIG.TP.pointBorderColor,
            pointBorderWidth: SIGNAL_BASE_CONFIG.TP.pointBorderWidth,
            pointRadius: 4.2,
            pointHoverRadius: 6.5,
            showLine: false
          },
          {
            label: '손절 (SL)',
            data: paddedSl,
            pointStyle: SIGNAL_BASE_CONFIG.SL.pointStyle,
            pointBackgroundColor: SIGNAL_BASE_CONFIG.SL.pointBackgroundColor,
            pointBorderColor: SIGNAL_BASE_CONFIG.SL.pointBorderColor,
            pointBorderWidth: SIGNAL_BASE_CONFIG.SL.pointBorderWidth,
            pointRadius: 4.2,
            pointHoverRadius: 6.5,
            showLine: false
          },
          {
            label: '트레일링 (TS)',
            data: paddedTs,
            pointStyle: SIGNAL_BASE_CONFIG.TS.pointStyle,
            pointBackgroundColor: SIGNAL_BASE_CONFIG.TS.pointBackgroundColor,
            pointBorderColor: SIGNAL_BASE_CONFIG.TS.pointBorderColor,
            pointBorderWidth: SIGNAL_BASE_CONFIG.TS.pointBorderWidth,
            pointRadius: 4.2,
            pointHoverRadius: 6.5,
            showLine: false
          },
          {
            label: '타임컷 (TC)',
            data: paddedTc,
            pointStyle: SIGNAL_BASE_CONFIG.TC.pointStyle,
            pointBackgroundColor: SIGNAL_BASE_CONFIG.TC.pointBackgroundColor,
            pointBorderColor: SIGNAL_BASE_CONFIG.TC.pointBorderColor,
            pointBorderWidth: SIGNAL_BASE_CONFIG.TC.pointBorderWidth,
            pointRadius: 4.2,
            pointHoverRadius: 6.5,
            showLine: false
          },
          {
            label: forecast ? forecast.forecastLabel : 'AI 예측 목표 경로 (Forecast)',
            data: forecastData,
            borderColor: forecast ? forecast.forecastColor : '#00D992',
            backgroundColor: forecast ? forecast.forecastBg : 'rgba(0, 217, 146, 0.20)',
            borderWidth: 2,
            borderDash: [4, 4],
            pointStyle: 'circle',
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: forecast ? forecast.forecastColor : '#00D992',
            pointBorderColor: '#101010',
            pointBorderWidth: 1.5,
            tension: 0.25,
            showLine: true
          },
          {
            label: 'OHLC High Bound',
            data: paddedHighs,
            pointRadius: 0,
            borderWidth: 0,
            showLine: false,
            hidden: false
          },
          {
            label: 'OHLC Low Bound',
            data: paddedLows,
            pointRadius: 0,
            borderWidth: 0,
            showLine: false,
            hidden: false
          }
        ]
      },
      options: {
        _ohlcData: rawData,
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: false },
          tooltip: {
            position: 'nearest',
            yAlign: 'bottom',
            caretSize: 6,
            caretPadding: 8,
            backgroundColor: 'rgba(26, 26, 26, 0.96)',
            titleColor: '#00D992',
            bodyColor: '#F2F2F2',
            borderColor: '#3D3A39',
            borderWidth: 1,
            padding: { top: 8, bottom: 8, left: 12, right: 12 },
            cornerRadius: 6,
            displayColors: false,
            titleFont: { family: "'Inter', sans-serif", weight: '600', size: 12 },
            bodyFont: { family: "'IBM Plex Mono', 'SFMono-Regular', monospace", size: 11.5 },
            callbacks: {
              title: function(context) {
                return `📅 ${context[0].label}`;
              },
              beforeBody: function(context) {
                const idx = context[0].dataIndex;
                if (idx >= rawData.length) {
                  const futureDayNum = idx - rawData.length + 1;
                  return [
                    `🔮 [미래 여백 및 AI 시나리오: D+${futureDayNum}]`,
                    `예상 목표가: ₩ ${targetPrice.toLocaleString()}`,
                    `예상 지지선: ₩ ${(forecast && forecast.supportPrice ? forecast.supportPrice : Math.round(lastClose * 0.96)).toLocaleString()}`
                  ];
                }
                const d = rawData[idx];
                if (!d || d.open === undefined) return null;
                const isUp = d.close >= d.open;
                const change = d.close - d.open;
                const changePct = ((change / d.open) * 100).toFixed(2);
                const sign = isUp ? '+' : '';
                const tag = isUp ? '🔴 양봉' : '🔵 음봉';
                return [
                  `시가(Open):  ₩ ${Math.round(d.open).toLocaleString()}`,
                  `고가(High):  ₩ ${Math.round(d.high).toLocaleString()}`,
                  `저가(Low):   ₩ ${Math.round(d.low).toLocaleString()}`,
                  `종가(Close): ₩ ${Math.round(d.close).toLocaleString()} (${sign}${changePct}% ${tag})`
                ];
              },
              label: function(context) {
                const val = context.raw;
                if (val === null || val === undefined) return null;
                const datasetLabel = context.dataset.label;
                if (datasetLabel.includes('OHLC') || datasetLabel.includes('실제 종가')) {
                  if (currentChartType === 'candle') return null;
                  return `종가: ₩ ${Math.round(val).toLocaleString()}`;
                }
                if (datasetLabel.includes('AI') || datasetLabel.includes('도약') || datasetLabel.includes('하방') || datasetLabel.includes('횡보')) {
                  if (forecast) {
                    const sign = forecast.targetChangePct >= 0 ? '+' : '';
                    const dirIcon = forecast.direction === 'BULLISH' ? '⚡' : (forecast.direction === 'BEARISH' ? '🔻' : '⏸️');
                    const dirName = forecast.direction === 'BULLISH' ? 'AI 도약 반등 목표' : (forecast.direction === 'BEARISH' ? 'AI 하방 이탈 위험' : 'AI 횡보 지지 테스트');
                    return `${dirIcon} ${dirName}: ₩ ${Math.round(val).toLocaleString()} (${sign}${forecast.targetChangePct.toFixed(1)}%)`;
                  }
                  return `⚡ AI 예측 목표: ₩ ${Math.round(val).toLocaleString()}`;
                }
                if (datasetLabel.includes('매수')) {
                  return `🔴 매수 (Buy): ₩ ${Math.round(val).toLocaleString()}`;
                }
                if (datasetLabel.includes('익절')) {
                  return `🟢 익절 (TP): ₩ ${Math.round(val).toLocaleString()}`;
                }
                if (datasetLabel.includes('손절')) {
                  return `⭕ 손절 (SL): ₩ ${Math.round(val).toLocaleString()}`;
                }
                if (datasetLabel.includes('트레일링')) {
                  return `▲ 트레일링 (TS): ₩ ${Math.round(val).toLocaleString()}`;
                }
                if (datasetLabel.includes('타임컷')) {
                  return `○ 타임컷 (TC): ₩ ${Math.round(val).toLocaleString()}`;
                }
                if (datasetLabel.includes('SMA20') || datasetLabel.includes('SMA60')) {
                  return `${datasetLabel}: ₩ ${Math.round(val).toLocaleString()}`;
                }
                return `${datasetLabel}: ₩ ${Math.round(val).toLocaleString()}`;
              }
            }
          },
          zoom: {
            limits: {
              x: { minRange: 12 }
            },
            pan: {
              enabled: true,
              mode: 'x',
              onPan: ({ chart }) => {
                updateDynamicMarkerScale(chart);
                chart.update('none');
              },
              onPanComplete: ({ chart }) => {
                updateDynamicMarkerScale(chart);
                chart.update('none');
              }
            },
            zoom: {
              wheel: { enabled: true, speed: 0.002, modifierKey: 'ctrl' },
              pinch: { enabled: true },
              mode: 'x',
              onZoom: ({ chart }) => {
                updateDynamicMarkerScale(chart);
                chart.update('none');
              },
              onZoomComplete: ({ chart }) => {
                updateDynamicMarkerScale(chart);
                chart.update('none');
              }
            }
          }
        },
        transitions: {
          zoom: { animation: { duration: 250, easing: 'easeOutCubic' } },
          pan: { animation: { duration: 150, easing: 'easeOutQuad' } }
        },
        scales: {
          x: { 
            min: initialMinLabel,
            max: initialMaxLabel,
            grid: { color: 'rgba(61, 58, 57, 0.45)' }, 
            ticks: { 
              color: '#8B949E', 
              font: { family: "'IBM Plex Mono', 'Inter', sans-serif", size: 11 },
              maxTicksLimit: 10 
            } 
          },
          y: { 
            suggestedMin: stockYMin,
            suggestedMax: stockYMax,
            grid: { color: 'rgba(61, 58, 57, 0.45)' }, 
            ticks: { 
              color: '#8B949E', 
              font: { family: "'IBM Plex Mono', 'Inter', sans-serif", size: 11 },
              callback: function(value) {
                if (value >= 1000) {
                  return '₩ ' + Math.round(value).toLocaleString('ko-KR');
                } else if (value > 0 && value < 1000) {
                  return '₩ ' + Math.round(value);
                }
                return value;
              }
            } 
          }
        }
      }
    });

    // Direct Mouse & Touch Left/Right Dragging (Pan)
    let isDragging = false;
    let lastDragX = 0;

    const chartCanvas = ctxPrice.canvas;
    const chartContainer = document.getElementById('priceChartContainer');

    chartCanvas.onmousedown = (e) => {
      if (e.button !== 0) return; // Only left click
      isDragging = true;
      lastDragX = e.clientX;
      if (chartContainer) chartContainer.classList.add('is-dragging');
    };

    window.onmousemove = (e) => {
      if (!isDragging || !priceChartInstance) return;
      const deltaX = e.clientX - lastDragX;
      if (Math.abs(deltaX) >= 1) {
        priceChartInstance.pan({ x: deltaX }, undefined, 'none');
        updateDynamicMarkerScale(priceChartInstance);
        priceChartInstance.update('none');
        lastDragX = e.clientX;
      }
    };

    window.onmouseup = () => {
      if (isDragging) {
        isDragging = false;
        if (chartContainer) chartContainer.classList.remove('is-dragging');
        updateDynamicMarkerScale(priceChartInstance);
        priceChartInstance.update('none');
      }
    };

    // Touch Dragging Support
    let lastTouchX = 0;
    chartCanvas.ontouchstart = (e) => {
      if (e.touches.length === 1) {
        lastTouchX = e.touches[0].clientX;
      }
    };

    chartCanvas.ontouchmove = (e) => {
      if (e.touches.length === 1 && priceChartInstance) {
        const deltaX = e.touches[0].clientX - lastTouchX;
        if (Math.abs(deltaX) >= 1) {
          priceChartInstance.pan({ x: deltaX }, undefined, 'none');
          updateDynamicMarkerScale(priceChartInstance);
          priceChartInstance.update('none');
          lastTouchX = e.touches[0].clientX;
        }
      }
    };

    // Support Horizontal Wheel Scroll & Shift+Wheel Scroll
    ctxPrice.canvas.addEventListener('wheel', (e) => {
      if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        const panAmount = (e.deltaX !== 0 ? -e.deltaX : -e.deltaY) * 0.8;
        if (priceChartInstance) {
          priceChartInstance.pan({ x: panAmount }, undefined, 'none');
          updateDynamicMarkerScale(priceChartInstance);
          priceChartInstance.update('none');
        }
      }
    }, { passive: false });

    // Toolbar buttons
    const panLeftBtn = document.getElementById('panLeftBtn');
    const panRightBtn = document.getElementById('panRightBtn');
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const resetZoomBtn = document.getElementById('resetZoomBtn');

    // Chart Type Toggle Buttons
    const chartTypeCandleBtn = document.getElementById('chartTypeCandleBtn');
    const chartTypeLineBtn = document.getElementById('chartTypeLineBtn');

    function setChartType(type) {
      if (currentChartType === type) return;
      currentChartType = type;
      if (chartTypeCandleBtn) chartTypeCandleBtn.classList.toggle('active', type === 'candle');
      if (chartTypeLineBtn) chartTypeLineBtn.classList.toggle('active', type === 'line');

      if (priceChartInstance) {
        priceChartInstance.data.datasets[0].borderColor = currentChartType === 'candle' ? 'transparent' : '#FFFFFF';
        priceChartInstance.data.datasets[0].borderWidth = currentChartType === 'candle' ? 0 : 1.8;
        priceChartInstance.data.datasets[0].showLine = currentChartType !== 'candle';
        priceChartInstance.update('none');
      }
    }

    if (chartTypeCandleBtn) chartTypeCandleBtn.onclick = () => setChartType('candle');
    if (chartTypeLineBtn) chartTypeLineBtn.onclick = () => setChartType('line');

    if (panLeftBtn) panLeftBtn.onclick = () => {
      if (priceChartInstance) {
        priceChartInstance.pan({ x: 100 }, undefined, 'none');
        updateDynamicMarkerScale(priceChartInstance);
        priceChartInstance.update('none');
      }
    };
    if (panRightBtn) panRightBtn.onclick = () => {
      if (priceChartInstance) {
        priceChartInstance.pan({ x: -100 }, undefined, 'none');
        updateDynamicMarkerScale(priceChartInstance);
        priceChartInstance.update('none');
      }
    };
    if (zoomInBtn) zoomInBtn.onclick = () => {
      if (priceChartInstance) {
        priceChartInstance.zoom(1.08, 'none');
        updateDynamicMarkerScale(priceChartInstance);
        priceChartInstance.update('none');
      }
    };
    if (zoomOutBtn) zoomOutBtn.onclick = () => {
      if (priceChartInstance) {
        priceChartInstance.zoom(0.92, 'none');
        updateDynamicMarkerScale(priceChartInstance);
        priceChartInstance.update('none');
      }
    };
    if (resetZoomBtn) resetZoomBtn.onclick = () => {
      if (priceChartInstance) {
        priceChartInstance.resetZoom('none');
        updateDynamicMarkerScale(priceChartInstance);
        priceChartInstance.update('none');
      }
    };

    // Apply currently active legend signal filter & highlight and dynamic scale
    applyLegendSignalFilter(currentActiveSignal);
    updateDynamicMarkerScale(priceChartInstance);

    // If Equity Modal is currently open, refresh its chart with latest stock data
    if (equityModal && equityModal.style.display === 'flex') {
      renderEquityModalChart();
    }
  }

  // -------------------------------------------------------------
  // Dedicated Equity Curve Modal Chart Renderer (Strategy vs Buy & Hold)
  // -------------------------------------------------------------
  function renderEquityModalChart() {
    if (!latestEquityData) return;
    const canvas = document.getElementById('equityChart');
    if (!canvas) return;
    const ctxEquity = canvas.getContext('2d');
    if (equityChartInstance) {
      equityChartInstance.destroy();
      equityChartInstance = null;
    }

    const { stockTitle, labels, equityCurve, buyHoldEquity, initialCapital, finalBalance, finalBhBalance, alphaPct, totalReturnPct, bhReturnPct } = latestEquityData;

    // Update modal DOM header and KPIs
    const modalStockBadge = document.getElementById('modalStockBadge');
    const modalInitialCapital = document.getElementById('modalInitialCapital');
    if (modalStockBadge) modalStockBadge.textContent = stockTitle;
    if (modalInitialCapital) modalInitialCapital.textContent = `₩ ${Math.round(initialCapital).toLocaleString()}`;
    if (modalFinalBalance) {
      modalFinalBalance.textContent = `₩ ${Math.round(finalBalance).toLocaleString()} (${totalReturnPct >= 0 ? '+' : ''}${totalReturnPct.toFixed(2)}%)`;
      modalFinalBalance.className = `eq-kpi-value ${totalReturnPct >= 0 ? 'text-emerald' : 'text-rose'}`;
    }
    if (modalBuyHoldBalance) {
      modalBuyHoldBalance.textContent = `₩ ${Math.round(finalBhBalance).toLocaleString()} (${bhReturnPct >= 0 ? '+' : ''}${bhReturnPct.toFixed(2)}%)`;
      modalBuyHoldBalance.className = `eq-kpi-value ${bhReturnPct >= 0 ? 'text-emerald' : 'text-rose'}`;
    }
    if (modalAlpha) {
      modalAlpha.textContent = `${alphaPct >= 0 ? '+' : ''}${alphaPct.toFixed(2)}%`;
      modalAlpha.className = `eq-kpi-value ${alphaPct >= 0 ? 'text-emerald' : 'text-rose'}`;
    }

    equityChartInstance = new Chart(ctxEquity, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: `${stockTitle} 눌림목 전략 잔고`,
            data: equityCurve,
            borderColor: '#00D992',
            backgroundColor: 'rgba(0, 217, 146, 0.12)',
            fill: true,
            borderWidth: 2.2,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: '#00D992',
            pointHoverBorderColor: '#FFFFFF',
            pointHoverBorderWidth: 2,
            tension: 0.15
          },
          {
            label: `${stockTitle} 단순 보유 (Buy & Hold)`,
            data: buyHoldEquity,
            borderColor: '#38BDF8',
            backgroundColor: 'transparent',
            borderWidth: 1.8,
            borderDash: [5, 4],
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: '#38BDF8',
            pointHoverBorderColor: '#FFFFFF',
            pointHoverBorderWidth: 1.5,
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { 
            display: true, 
            position: 'top',
            labels: { 
              color: '#F2F2F2', 
              font: { family: "'Inter', sans-serif", weight: '600', size: 12 },
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 16
            } 
          },
          tooltip: {
            backgroundColor: 'rgba(26, 26, 26, 0.96)',
            titleColor: '#00D992',
            bodyColor: '#F2F2F2',
            borderColor: '#3D3A39',
            borderWidth: 1,
            cornerRadius: 6,
            padding: 10,
            titleFont: { family: "'IBM Plex Mono', 'Inter', sans-serif", weight: '700', size: 12 },
            bodyFont: { family: "'IBM Plex Mono', 'Inter', sans-serif", size: 11.5 },
            callbacks: {
              title: function(context) {
                return `📅 ${context[0].label}`;
              },
              label: function(context) {
                const val = context.raw;
                if (val === null || val === undefined) return null;
                const ret = ((val - initialCapital) / initialCapital) * 100;
                const sign = ret >= 0 ? '+' : '';
                return `${context.dataset.label}: ₩ ${Math.round(val).toLocaleString()} (${sign}${ret.toFixed(2)}%)`;
              }
            }
          }
        },
        scales: {
          x: { 
            grid: { color: 'rgba(61, 58, 57, 0.45)' }, 
            ticks: { 
              color: '#8B949E', 
              font: { family: "'IBM Plex Mono', 'Inter', sans-serif", size: 11 }, 
              maxTicksLimit: 8 
            } 
          },
          y: { 
            grid: { color: 'rgba(61, 58, 57, 0.45)' }, 
            ticks: { 
              color: '#8B949E', 
              font: { family: "'IBM Plex Mono', 'Inter', sans-serif", size: 11 },
              callback: function(v) { return '₩ ' + (v >= 1000000 ? (v / 10000).toLocaleString() + '만' : v.toLocaleString()); }
            } 
          }
        }
      }
    });
  }

  // -------------------------------------------------------------
  // Pointer-Position-Aware Radial Fill Animation for Pill Buttons
  // -------------------------------------------------------------
  function setupPointerFillAnimation() {
    const selector = '.btn-estimation, #estimationBtn, .legend-filter-btn, .tab-filter, .btn-chart-ctrl, .btn-primary, .recent-chip, .btn-preset, .btn-gear-circle, .kpi-pill, .preset-tag, .pill-sub, .forecast-prob-badge';

    function updateCoords(e) {
      const btn = e.target.closest(selector);
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);
      btn.style.setProperty('--cursor-x', `${x}px`);
      btn.style.setProperty('--cursor-y', `${y}px`);
    }

    document.addEventListener('pointerenter', updateCoords, true);
    document.addEventListener('pointermove', updateCoords, true);
    document.addEventListener('pointerdown', updateCoords, true);
  }

  setupPointerFillAnimation();

  // -------------------------------------------------------------
  // Leonardo.ai Style Button Click Shockwave Pulse Trigger
  // -------------------------------------------------------------
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-primary, .btn-leonardo, .btn-estimation, #estimationBtn, #runSimBtn, #chartEquityModalBtn, #fullscreenToggleBtn');
    if (!btn) return;
    btn.classList.remove('leonardo-pulse');
    // Force reflow
    void btn.offsetWidth;
    btn.classList.add('leonardo-pulse');
  }, true);

  // Initial Run on load
  runSimulation();
});
