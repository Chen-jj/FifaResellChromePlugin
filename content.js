(function() {
    console.log("FIFA 探测器 - 同步拉环版已启动");

    const XHR = XMLHttpRequest.prototype;
    const send = XHR.send;
    const open = XHR.open;
    const setRequestHeader = XHR.setRequestHeader;
    const CONVERSION_FACTOR = 0.00115;

    let globalRawSeats = [];
    let seenSeatIds = new Set();
    let lastHeaders = null;
    let lastFullUrl = ""; 
    let showOnlyPairs = true;
    let isPanelOpen = true; 

    const safePath = [
        "10000,5000,5000,5000", "5000,5000,10000,5000", "5000,0,10000,10000", "5000,5000,5000,5000",
        "5000,5000,5000,10000", "5000,10000,5000,5000", "0,10000,10000,5000", "0,10000,10000,10000",
        "5000,15000,5000,5000", "0,15000,10000,5000", "0,15000,10000,10000", "5000,20000,5000,5000",
        "5000,20000,5000,10000", "0,20000,10000,10000", "5000,25000,5000,5000", "5000,25000,5000,10000",
        "5000,25000,10000,10000", "10000,25000,5000,10000", "10000,25000,10000,10000", "10000,30000,10000,5000",
        "15000,30000,5000,5000", "15000,30000,10000,5000", "20000,30000,5000,5000", "20000,30000,10000,5000",
        "25000,25000,5000,10000", "25000,30000,10000,5000", "25000,25000,10000,10000", "30000,25000,5000,10000",
        "30000,25000,10000,10000", "30000,25000,10000,5000", "30000,20000,10000,10000", "30000,20000,10000,5000",
        "30000,15000,10000,10000", "30000,15000,10000,5000", "30000,10000,10000,10000", "30000,10000,10000,5000",
        "30000,5000,10000,10000", "30000,5000,10000,5000", "30000,0,10000,10000", "30000,0,5000,10000",
        "30000,0,10000,5000", "30000,0,5000,5000", "25000,0,10000,5000", "25000,0,5000,5000",
        "20000,0,10000,5000", "20000,0,5000,5000", "15000,0,10000,5000", "15000,0,5000,5000",
        "10000,0,10000,5000", "10000,0,5000,5000", "5000,0,5000,10000", "10000,5000,10000,5000",
        "15000,5000,5000,5000", "10000,5000,10000,10000", "10000,10000,10000,5000", "10000,10000,10000,10000",
        "10000,15000,10000,5000", "15000,20000,10000,10000", "15000,20000,10000,5000", "20000,20000,10000,10000",
        "25000,20000,5000,5000", "20000,20000,10000,5000", "20000,15000,10000,10000", "15000,10000,10000,10000",
        "25000,10000,10000,10000", "25000,15000,10000,10000", "25000,15000,5000,10000", "25000,5000,5000,10000"
    ];

    XHR.open = function(method, url) { this._url = url; return open.apply(this, arguments); };
    XHR.setRequestHeader = function(header, value) {
        if (!this._requestHeaders) this._requestHeaders = {};
        this._requestHeaders[header] = value;
        return setRequestHeader.apply(this, arguments);
    };
    XHR.send = function() {
        this.addEventListener('load', function() {
            if (this._url.includes('productId=') && this._url.includes('bbox=')) {
                lastFullUrl = this._url;
                lastHeaders = this._requestHeaders;
                processData(this.responseText);
            }
        });
        return send.apply(this, arguments);
    };

    function processData(jsonText) {
        try {
            const response = JSON.parse(jsonText);
            const seatData = response.features || (Array.isArray(response) ? response : []);
            if (seatData.length > 0) {
                seatData.forEach(item => {
                    const p = item.properties;
                    if (!p || seenSeatIds.has(p.id)) return;
                    seenSeatIds.add(p.id);
                    globalRawSeats.push({
                        id: p.id,
                        block: p.block?.name?.en || "N/A",
                        row: p.row || "N/A",
                        num: parseInt(p.number) || 0,
                        price: p.amount * CONVERSION_FACTOR,
                        cat: p.seatCategory || "Other"
                    });
                });
                updateUI();
            }
        } catch (e) {}
    }

    function getGroupedSeats() {
        let results = {};
        let map = {};
        globalRawSeats.forEach(s => {
            let key = `${s.cat}|${s.block}|${s.row}`;
            if (!map[key]) map[key] = [];
            map[key].push(s);
        });
        for (let key in map) {
            let [cat, block, row] = key.split('|');
            let rowSeats = map[key].sort((a, b) => a.num - b.num);
            let pairs = [];
            if (showOnlyPairs) {
                for (let i = 0; i < rowSeats.length - 1; i++) {
                    if (rowSeats[i+1].num === rowSeats[i].num + 1) {
                        pairs.push({ block, row, nums: `${rowSeats[i].num}, ${rowSeats[i+1].num}`, price: rowSeats[i].price });
                        i++; 
                    }
                }
            } else {
                rowSeats.forEach(s => pairs.push({ block, row, nums: s.num, price: s.price }));
            }
            if (pairs.length > 0) {
                if (!results[cat]) results[cat] = [];
                results[cat] = results[cat].concat(pairs);
            }
        }
        return results;
    }

    async function scanFullMap() {
        if (!lastFullUrl || !lastHeaders) {
            alert("请先操作地图激活授权！");
            return;
        }
        const scanBtn = document.getElementById('scan-all-btn');
        const timerText = document.getElementById('timer-text');
        if (window.isScanning) { window.isScanning = false; scanBtn.innerText = "🚀 开始全场扫描"; return; }

        window.isScanning = true;
        const INTERVAL = 3000;

        for (let i = 0; i < safePath.length; i++) {
            if (!window.isScanning) break;
            const bbox = safePath[i];
            const remainingSec = Math.round(((safePath.length - (i + 1)) * INTERVAL) / 1000);
            scanBtn.innerText = `🛑 停止 (${i+1}/${safePath.length})`;
            if (timerText) timerText.innerText = `剩余: ${remainingSec}s | ${globalRawSeats.length}座`;

            try {
                const urlObj = new URL(lastFullUrl);
                urlObj.searchParams.set('bbox', bbox);
                urlObj.searchParams.set('v', Date.now());
                const res = await fetch(urlObj.toString(), { headers: lastHeaders });
                if (res.status === 200) processData(await res.text());
            } catch (err) {}
            await new Promise(r => setTimeout(r, INTERVAL));
        }
        window.isScanning = false;
        if (scanBtn) scanBtn.innerText = "🚀 开始全场扫描";
    }

    function initUI() {
        if (document.getElementById('fifa-wrapper')) return;
        
        // 创建一个包装容器，包裹按钮和面板
        const wrapper = document.createElement('div');
        wrapper.id = 'fifa-wrapper';
        // 关键：wrapper 的宽度随 transform 移动，按钮放在面板左侧
        wrapper.style = "position:fixed; top:0; right:0; height:100vh; width:360px; z-index:999999; transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); transform: translateX(0); display:flex; align-items:center;";
        
        wrapper.innerHTML = `
            <div id="panel-toggle" style="position:absolute; left:-30px; width:30px; height:80px; background:#006BD6; color:white; display:flex; align-items:center; justify-content:center; cursor:pointer; writing-mode:vertical-rl; border-radius:10px 0 0 10px; box-shadow:-2px 0 10px rgba(0,0,0,0.2); font-size:12px; font-weight:bold; letter-spacing:2px; pointer-events:auto;">
                收起面板 >
            </div>

            <div id="fifa-side-panel" style="width:360px; height:100vh; background:#fff; box-shadow:-5px 0 20px rgba(0,0,0,0.1); border-left:1px solid #ddd; display:flex; flex-direction:column; font-family:sans-serif; pointer-events:auto;">
                <div style="background:#006BD6; color:white; padding:20px; font-weight:bold; font-size:18px;">
                    FIFA 连坐探测器
                    <div id="timer-text" style="font-size:12px; font-weight:normal; margin-top:8px; opacity:0.9;">就绪 | 汇率 0.00115</div>
                </div>
                <div style="padding:15px; border-bottom:1px solid #eee; background:#fcfcfc;">
                    <button id="scan-all-btn" style="width:100%; background:#006BD6; color:white; border:none; padding:15px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:15px;">🚀 开始全场扫描</button>
                    <div style="margin-top:15px; display:flex; align-items:center; justify-content:space-between; background:#fff; padding:10px; border-radius:6px; border:1px solid #ddd;">
                        <span style="font-size:13px; font-weight:bold; color:#333;">👯 仅显示连坐</span>
                        <input type="checkbox" id="pair-filter-check" style="width:20px; height:20px; cursor:pointer;" checked>
                    </div>
                    <button id="clear-btn" style="width:100%; margin-top:10px; background:none; border:1px solid #ccc; color:#666; padding:6px; border-radius:6px; cursor:pointer; font-size:11px;">清空数据</button>
                </div>
                <div id="fifa-results" style="flex:1; overflow-y:auto; padding:15px; background:#f4f4f4;"></div>
            </div>
        `;
        document.body.appendChild(wrapper);

        const toggleBtn = document.getElementById('panel-toggle');

        toggleBtn.onclick = () => {
            isPanelOpen = !isPanelOpen;
            if (isPanelOpen) {
                wrapper.style.transform = "translateX(0)";
                toggleBtn.innerText = "收起面板 >";
            } else {
                // 面板移出去 360px，由于按钮是 absolute left -30px，
                // 它会停留在离屏幕右边缘 0 的位置，只露出自己 30px 的宽度
                wrapper.style.transform = "translateX(360px)";
                toggleBtn.innerText = "展开数据 <";
            }
        };

        document.getElementById('scan-all-btn').onclick = scanFullMap;
        document.getElementById('clear-btn').onclick = () => {
            globalRawSeats = []; seenSeatIds.clear();
            updateUI();
        };
        document.getElementById('pair-filter-check').onchange = (e) => {
            showOnlyPairs = e.target.checked;
            updateUI();
        };
    }

    function updateUI() {
        const container = document.getElementById('fifa-results');
        if (!container) return;
        let groupedData = getGroupedSeats();
        if (Object.keys(groupedData).length === 0) {
            container.innerHTML = `<div style="text-align:center; color:#999; margin-top:50px;">暂无数据</div>`;
            return;
        }
        container.innerHTML = '';
        Object.keys(groupedData).sort().forEach(cat => {
            groupedData[cat].sort((a,b) => a.price - b.price);
            const card = document.createElement('div');
            card.style = "margin-bottom:15px; background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1); border:1px solid #e0e0e0;";
            card.innerHTML = `<div style="background:#e3f2fd; padding:10px 15px; border-bottom:1px solid #bbdefb; display:flex; justify-content:space-between; align-items:center;"><span style="font-weight:bold; color:#1565c0; font-size:13px;">${cat}</span><span style="background:#2e7d32; color:white; padding:2px 8px; border-radius:12px; font-size:11px;">$${groupedData[cat][0].price.toFixed(2)}</span></div><div id="list-${cat.replace(/\s+/g, '')}"></div>`;
            const listContainer = card.querySelector(`#list-${cat.replace(/\s+/g, '')}`);
            groupedData[cat].slice(0, 15).forEach(s => {
                const item = document.createElement('div');
                item.style = "padding:10px 15px; font-size:12px; border-bottom:1px solid #f0f0f0; display:flex; justify-content:space-between; align-items:center;";
                item.innerHTML = `<div><div style="font-weight:bold; color:#333;">Block ${s.block} | Row ${s.row}</div><div style="color:#666; font-size:11px;">Seat: <span style="color:#d32f2f; font-weight:bold;">${s.nums}</span></div></div><div style="text-align:right;"><span style="font-weight:bold; font-size:14px; color:#333;">$${s.price.toFixed(2)}</span></div>`;
                listContainer.appendChild(item);
            });
            container.appendChild(card);
        });
    }

    setInterval(() => { if (document.body) initUI(); }, 1000);
})();