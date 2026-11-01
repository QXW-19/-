/* V2.3 浏览器自动验收：依赖 @playwright/test；自动启动本地静态服务。 */
const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({
  testDir:'./tests/browser',
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
    command:process.platform==='win32'
      ? 'py -m http.server 8001 --bind 127.0.0.1'
      : 'python3 -m http.server 8001 --bind 127.0.0.1',
    url:'http://127.0.0.1:8001/',
    reuseExistingServer:!process.env.CI,
    timeout:60000
  }
});
