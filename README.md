# FifaResellChromePlugin
Automated ticket price aggregator for FIFA Resale Platform. No more manual map zooming.By Gemini AI.

**Stop hovering, start buying!** 这是一个专为 **FIFA 2026 世界杯官方转售平台** 设计的 Chrome 插件。旨在解决官方平台“必须手动放大地图、鼠标悬停才能看票价”的反人类 UI 设计。

### 🌟 核心功能
- **全场秒扫**：一键抓取当前场次所有看台（Block）的实时转售价。
- **自动聚合**：无需手动缩放地图，所有余票价格一目了然。
- **最低价优先**：帮助你快速锁定全场“性价比之王”，直奔目标区域。

---

### 🛠️ 安装方法 (Installation)

由于本插件为个人开发工具，目前建议通过 **开发者模式** 加载：

1. **下载代码**：点击右上角 `Code` -> `Download ZIP` 并解压，或直接 `git clone` 本仓库。
2. **打开扩展程序**：在 Chrome 浏览器地址栏输入 `chrome://extensions/`。
3. **启用开发者模式**：打开右上角的 **“开发者模式 (Developer mode)”** 开关。
4. **加载插件**：点击左上角的 **“加载解压的扩展程序 (Load unpacked)”**，选择你解压后的文件夹。

---

### 📖 使用说明 (How to use)

1. 登录 [FIFA 2026 Resale Platform](https://fwc26-resale-usd.tickets.fifa.com/) 并进入具体的比赛场次页面。
2. 当页面加载出球场地图后，需要先手动滚动放大查看某个区域的票价，然后才能点击插件的自动扫描按钮。
3. 插件会自动扫描全场数据，并为你展示当前所有可购买席位的价格列表。
4. 点击列表中的区域，直接精准定位，开抢！

---

### 👨‍💻 技术实现 (Technical Details)
- **Manifest V3**: 采用最新的 Chrome 插件标准。
- **Injected Script**: 通过 `inject.js` 绕过沙箱限制，直接与页面底层数据逻辑交互。
- **CSS Optimization**: `style.css` 确保扫描结果以直观的浮窗形式展示，不遮挡核心购票操作。

---

### ⚠️ 免责声明 (Disclaimer)
- 本工具仅用于提高查询效率，**不保证**一定能买到票。
- 本工具不收集任何个人隐私、支付信息或 FIFA 账号凭证。
- 仅供学习与交流使用，请遵守 FIFA 官网的使用准则。
