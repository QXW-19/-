/* V2.4 浏览器自动验收：依赖 @playwright/test；由 tests/static-server.cjs 启动本地静态服务。 */
const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({
  testDir:'./tests/browser',
  // 输出目录可通过环境变量覆盖：本地反复回归时指向独立目录，
  // 避免历史报告堆积导致清理失败；CI 使用默认 test-results。
  // 固定放到 test-results/current：Playwright 每轮只清理这个子目录，
  // 不会因为历史上千个截图/追踪文件触发批量删除保护。
  outputDir:process.env.PW_OUTPUT_DIR||'test-results/current',
  timeout:45000,
  expect:{timeout:12000},
  fullyParallel:false,
  retries:process.env.CI?1:0,
  // 每个页面会创建 5 个 WebGL 上下文（五个 Three.js 场景）+ 若干 2D 画布。
  // 12 核机器上开 6 个 worker 意味着 30 个上下文同时存活，软件光栅化下会拖慢
  // 上下文关闭，出现「Tearing down context exceeded 45000ms」。实测 4 个 worker
  // 既能让整轮回归保持在数分钟内，也不会让上下文数量失控。
  workers:process.env.CI?1:4,
  reporter:process.env.CI?[['list'],['html',{open:'never'}]]:'list',
  use:{
    baseURL:'http://127.0.0.1:8001',
    browserName:'chromium',
    headless:true,
    // 只在「首次重试」时录制轨迹：本地不重试即零轨迹文件，CI 重试时自动带上，
    // 既能定位不稳定用例，又不会让每轮跑完留下上千个 trace 文件触发批量删除保护。
    // 需要逐动作复现时显式运行：npx playwright test --trace=on
    trace:'on-first-retry',
    screenshot:'only-on-failure'
  },
  webServer:{
    // 统一用仓库自带的 Node 静态服务：HTTP/1.1 keep-alive，避免 Windows 上
    // Python http.server 的短连接耗尽问题，也不再依赖本机是否安装 Python。
    command:'node tests/static-server.cjs',
    url:'http://127.0.0.1:8001/',
    reuseExistingServer:!process.env.CI,
    timeout:60000
  }
});
