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
  workers:process.env.CI?1:undefined,
  reporter:process.env.CI?[['list'],['html',{open:'never'}]]:'list',
  use:{
    baseURL:'http://127.0.0.1:8001',
    browserName:'chromium',
    headless:true,
    trace:'retain-on-failure',
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
