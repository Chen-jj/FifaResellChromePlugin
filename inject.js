(function() {
    const XHR = XMLHttpRequest.prototype;
    const send = XHR.send;
    const open = XHR.open;
    const setRequestHeader = XHR.setRequestHeader; // 劫持设置请求头的方法
    const CONVERSION_FACTOR = 0.00115;

    XHR.open = function(method, url) {
        this._url = url;
        this._requestHeaders = {}; // 初始化存储请求头
        return open.apply(this, arguments);
    };

    // 记录浏览器设置的每一个 Header
    XHR.setRequestHeader = function(header, value) {
        this._requestHeaders[header] = value;
        return setRequestHeader.apply(this, arguments);
    };

    XHR.send = function() {
        this.addEventListener('load', function() {
            if (this._url && this._url.includes('/tnwr/v1/secure/seatmap/seats/free/ol')) {
                // --- 新增：打印请求头信息到控制台 ---
                console.log("%c[FIFA API Debug] 检测到座位请求", "color: #006BD6; font-weight: bold; font-size: 14px;");
                console.log("URL:", this._url);
                console.log("Method: GET");
                console.log("Request Headers:", this._requestHeaders);
                // ----------------------------------

                try {
                    const response = JSON.parse(this.responseText);
                    const seatData = Array.isArray(response) ? response : (response.seats || Object.values(response).find(Array.isArray));
                    if (seatData) {
                        const processed = seatData.map(item => {
                            if (!item.properties) return null;
                            const p = item.properties;
                            return {
                                id: p.id,
                                block: p.block?.name?.en || "N/A",
                                row: p.row || "N/A",
                                num: p.number || "N/A",
                                price: p.amount * CONVERSION_FACTOR,
                                cat: p.seatCategory || "其他"
                            };
                        }).filter(i => i !== null);
                        window.dispatchEvent(new CustomEvent("FIFA_DATA_INTERCEPTED", { detail: processed }));
                    }
                } catch (err) {
                    console.error("解析数据失败", err);
                }
            }
        });
        return send.apply(this, arguments);
    };
})();