/* V2.4 浏览器自动验收：依赖 @playwright/test；由 tests/static-server.cjs 启动本地静态服务。 */
const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({
  testDir:'./tests/browser',
  // 输出目录可通过环境变量覆盖：本地反复回归时指向独立目录，
  // 避免历史报告堆积导致清理失败；CI 使用默认 test-results。
  outputDir:process.env.PW_OUTPUT_DIR||'test-results',
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
    // 只保留「动作/控制台/网络」轨迹，不录制每个动作的 DOM 快照。
    // 全量快照会让每个用例的收尾阶段写入大量数据，是此前后台收尾超时的主因；
    // 关闭快照后仍能在失败时定位到具体操作与报错，需要逐帧复现时可加 --trace=on。
    trace:{mode:'retain-on-failure',snapshots:false,sources:false},
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
