/* V2.4 发布元信息自检：防止 package、锁文件及入口展示版本漂移。
 * 不执行网络请求，也不访问或改写用户的浏览器学习记录。
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const readJson=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const pkg=readJson('package.json');
const lock=readJson('package-lock.json');
const entry=fs.readFileSync(path.join(root,'index.html'),'utf8');
const checks=[
 ['项目与锁文件版本统一为 V2.5.1',()=>{
  assert.equal(pkg.version,'2.5.1');
  assert.equal(lock.version,pkg.version);
  assert.equal(lock.packages[''].version,pkg.version);
  assert.equal(lock.name,pkg.name);
  assert.equal(lock.packages[''].name,pkg.name);
 }],
 ['锁文件包含 Playwright 的依赖信息',()=>{
  assert.equal(lock.lockfileVersion,3);
  assert.equal(lock.packages[''].devDependencies['@playwright/test'],pkg.devDependencies['@playwright/test']);
  assert.ok(lock.packages['node_modules/@playwright/test']?.version);
 }],
 ['入口页面显示 V2.5 并保留深链接',()=>{
  assert.match(entry,/<title>[^<]*V2\.5[^<]*<\/title>/);
  assert.match(entry,/<h1>[^<]*V2\.5[^<]*<\/h1>/);
  assert.match(entry,/window\.location\.replace/);
  assert.match(entry,/window\.location\.hash/);
 }],
 ['保留全部既有测试命令',()=>{
  for(const key of ['test:legacy','test:structure','test:split','test:audit','test:teaching','test:loop','test:browser','test:all']){
   assert.equal(typeof pkg.scripts[key],'string',key+' 缺少脚本');
  }
 }]
];
for(const [name,run] of checks){run();console.log('PASS '+name);}
console.log('V2.4 发布元信息 '+checks.length+' 项检查通过。');
