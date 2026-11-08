/* ==========================================================================
   V2.5 阶段 E 工程结构自检：目录组织、脚本顺序、模型边界声明、兼容性约束。
   不访问网络，不改写任何文件。
   ========================================================================== */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'数字电子技术基础-互动课堂.html'),'utf8');
let count=0;
function ok(cond,label){assert.ok(cond,label);count++;console.log('PASS '+label);}
function parse(file){
 const src=fs.readFileSync(path.join(root,file),'utf8');
 new vm.Script(src,{filename:file});return src;
}
const FILES={
 examples:'assets/labs/examples/v2.5-examples.js',
 signals:'assets/labs/circuit-renderer/v2.5-signals.js',
 waveform:'assets/labs/waveform-analyzer/v2.5-waveform.js',
 editor:'assets/labs/circuit-editor/v2.5-lab.js',
 course:'assets/labs/examples/v2.5-course-links.js',
 camera:'assets/scenes/controls/v2.5-camera.js',
 lifecycle:'assets/scenes/lifecycle/v2.5-lifecycle.js',
 polish:'assets/scenes/lifecycle/v2.5.1-scene-polish.js',
 css:'assets/styles/v2.5-lab.css'
};

/* E1 目录组织 */
for(const [name,file]of Object.entries(FILES))ok(fs.existsSync(path.join(root,file)),'目录文件 '+name+' 存在');
ok(fs.existsSync(path.join(root,'tests/unit/verify-v2.5-core.cjs')),'单元测试位于 tests/unit/');
for(const f of ['v25-lab.spec.cjs','v25-scenes.spec.cjs','v25-course-links.spec.cjs'])
 ok(fs.existsSync(path.join(root,'tests/browser',f)),'浏览器测试 '+f+' 存在');

/* 脚本加载顺序：案例 → 信号 → 波形 → 编辑器 → 课程联动 */
const order=[FILES.examples,FILES.signals,FILES.waveform,FILES.editor,FILES.course]
 .map(f=>html.indexOf(f));
ok(order.every((p,i)=>p>0&&(i===0||p>order[i-1])),'V2.5 模块按依赖顺序加载');
ok(html.indexOf(FILES.camera)<html.indexOf(FILES.lifecycle),'3D 相机控制器先于生命周期模块');
ok(html.indexOf(FILES.lifecycle)<html.indexOf(FILES.polish),'场景精修模块在生命周期之后');
const polish=parse(FILES.polish);
ok(/function release\(/.test(polish)&&/function recreate\(/.test(polish),'场景支持永久释放与重建');
ok(/geometry\.dispose\(\)/.test(polish)&&/forceContextLoss/.test(polish),'释放真实 GPU 资源');
ok(/v251-scene-info/.test(polish)&&/v251-legend/.test(polish),'新增关键元件与三值图例');
ok(/limits\.min=Math\.max/.test(polish),'提供相机防穿模下限');
ok(html.indexOf(FILES.camera)<html.indexOf('window.onShow_w1'),'3D 控制器在场景模块之前可用');

/* 五个场景注册点 */
for(let i=1;i<=5;i++)ok(html.includes("DigitalV25Scenes.register('w"+i+"'"),'场景 w'+i+' 已注入注册点');
ok(html.includes('assets/styles/v2.5-lab.css'),'V2.5 样式已接入');

/* 复用引擎、不建第二套仿真核心 */
const editor=parse(FILES.editor),signal=parse(FILES.signals),wave=parse(FILES.waveform);
ok(/window\.DigitalMixedCircuit/.test(editor)&&/M\.evaluate/.test(editor),'编辑器复用 V1.6 引擎求值');
ok(/M\.evaluate\(circuit\)/.test(signal),'信号采样直接读取引擎状态');
ok(/S\.sample/.test(wave)&&!/function evalGate/.test(wave),'波形仪不重复实现门逻辑');
ok(/M\.validate/.test(editor),'编辑器沿用引擎校验规则');

/* 模型边界声明 */
ok(/不计算真实传播延迟/.test(editor)&&/真实示波器测量结果/.test(wave),
  '明确声明理想离散事件模型边界');
ok(/0、1、X/.test(editor),'声明三值逻辑');
ok(/digital-course-v2\.5-circuit/.test(editor),'使用独立带版本号的存储键');
ok(/digital-course-v1\.6-mixed/.test(editor),'提供旧版存档兼容读取');

/* 资源释放与事件委托 */
ok(/canvas\.addEventListener\('pointermove',onPointerMove\)/.test(editor)&&
   /canvas\.addEventListener\('click'/.test(editor),'画布级指针与点击统一委托处理');
ok(/new MutationObserver/.test(parse(FILES.lifecycle))&&/disconnect\(\)/.test(parse(FILES.lifecycle)),
  '生命周期模块可释放观察者');
ok(/pagehide/.test(editor)&&/pagehide/.test(parse(FILES.lifecycle)),'页面卸载时释放资源');
ok(/new ResizeObserver/.test(parse(FILES.lifecycle)),'使用统一尺寸观察器');

/* 兼容性硬约束 */
const sections=[...html.matchAll(/<section\b[^>]*class=["'][^"']*\bmod\b[^"']*["'][^>]*\bid=["']([^"']+)["']/gi)].map(x=>x[1]);
ok(sections.length===51,'HTML 中 51 个原始教学模块保持不变');
for(let i=1;i<=8;i++)ok(sections.includes('c'+i),'第 '+i+' 章保留');
for(let i=1;i<=5;i++)ok(sections.includes('w'+i),'第 '+i+' 个 3D 场景保留');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
ok(pkg.version==='2.5.0','发布版本为 2.5.0');
ok(typeof pkg.scripts['test:unit']==='string','test:unit 已接入 npm 脚本');
const wf=fs.readFileSync(path.join(root,'.github/workflows/v2.4-regression.yml'),'utf8');
ok(wf.includes('feature/digital-course-v2.5'),'CI 已允许 V2.5 分支触发');
ok(wf.includes('npm run test:unit'),'CI 已加入 V2.5 单元测试步骤');
console.log('V2.5 工程结构共 '+count+' 项检查通过。');
