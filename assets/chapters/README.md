# V2.3 章节脚本拆分说明

参考教材：阎石《数字电子技术基础》第六版。本目录中的脚本来自原来约 52 万字符的 `数字电子技术基础-互动课堂.html`，**本次只做逐字外置，不改写教学内容和实验逻辑**。

| 章节 | 新脚本 | 原互动页面 |
|---|---|---|
| 第一章 | `ch01-complement.js` | `m1` 补码刻度盘 |
| 第二章 | `ch02-karnaugh.js` | `m2` 卡诺图 |
| 第三章 | `ch03-cmos.js` | `m3` CMOS 反相器 |
| 第四章 | `ch04-hazard.js` | `m4` 竞争-冒险 |
| 第五章 | `ch05-flipflop.js` | `m5` 触发器采样 |
| 第六章 | `ch06-sequence.js` | `m6` 状态表/状态图 |
| 第七章 | `ch07-555.js` | `m7` 555 多谐振荡器 |
| 第八章 | `ch08-adc.js` | `m8` 逐次逼近 ADC |

## 执行顺序是兼容性约束

这些脚本作为普通 `<script src="..."></script>` 留在原来的章节代码后面，浏览器会在解析到它们时**同步执行**。不能随意给它们加 `defer`、`async`、`type="module"`，也不能直接把它们移动到 `<head>`，因为它们启动时会立即通过 `document.getElementById` 绑定操作按钮。

原目录与 `show(id)` 路由也独立保存到 `assets/legacy/navigation.js`，仍放在原 HTML 底部、所有旧版 V1.1～V2.2 `defer` 脚本之前。公共 CSS 逐字保存为 `assets/legacy/classroom.css`，从 `<head>` 原样引用。

## V2.4 第一批补充拆分（自包含 IIFE）

以下 5 个脚本原本是主 HTML 中的独立 IIFE，不写全局变量、不调用 `document.write`、不依赖其他内联脚本的函数。它们在**原位置**替换为普通同步 `<script src="..."></script>`，未加 `defer`、`async` 或 `type="module"`，执行时机与顺序保持不变。

| 章节 | 新脚本 | 所属原始模块 | 外置字符数 |
|---|---|---|---|
| 第一章 | `ch01-number-codes.js` | `g6` 数制与五种编码对照 | 2831 |
| 第二章 | `ch02-minterms.js` | `g7` 最小项与公式速查 | 1879 |
| 第五章 | `ch05-memory-expansion.js` | `n10` 存储器字长/容量扩展 | 12398 |
| 第六章 | `ch06-sequential-design.js` | `n11` 时序设计四步 | 17114 |
| 第八章 | `ch08-adc-specs.js` | `g8` ADC/DAC 量化指标 | 2167 |

这一批共外置 36389 字符；主 HTML 由 412978 字符降至 376806 字符，内联脚本由 30 个降至 25 个（265042 → 228653 字符），脚本标签总数仍为 71 个。结构约束由 `tests/verify-v2.4-split.cjs` 固定，浏览器行为由 `tests/browser/v24-split-modules.spec.cjs` 覆盖。

## 修改规范

- 调整脚本或样式时，先运行 `node tests/verify-v2.3.cjs`。如果合法编辑导致内容哈希变化，必须人工核对修改后再更新测试里的对应哈希，不应直接删除检查。
- 新增或调整 V2.4 拆分时，同步运行 `npm run test:split`（结构）与 `npm run test:browser`（行为）。
- 后续批次仍需先分析 DOM 初始化时机与跨脚本全局依赖，优先迁移无全局变量写入的独立 IIFE；3D `type="module"` 脚本涉及 CDN 与 WebGL，须单独分级验收后再动。
- 运行 `npm run test:browser` 可通过 Playwright/Chromium 自动测试页面加载、八章按钮、资源搜索、学习进度和浏览器宽度；运行前执行 `npm install` 及 `npx playwright install chromium`。
- 原本 51 个 `<section class="mod">` 仍保留在 HTML；尚未拆出的其他 inline 脚本、3D/WebGL 模块不属于本轮。
- 拆分后页面需要通过本地 HTTP 服务访问，不能只双击本地 HTML：外部脚本、模块加载和站点存储在 `file://` 下无法保证一致性。
