/* V2.4 工程重构前审计：不修改原教材 HTML 或学习数据。
 * 输出剩余内联脚本、外部资源、DOM 模块与兼容性风险，供分批迁移使用。
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const source=path.join(root,'数字电子技术基础-互动课堂.html');
const html=fs.readFileSync(source,'utf8');
const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
const localScripts=[],inlineScripts=[],remoteScripts=[];
const failures=[];
for(let i=0;i<scripts.length;i++){
  const attrs=scripts[i][1],body=scripts[i][2],src=attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
  const type=attrs.match(/\btype\s*=\s*["']([^"']+)["']/i)?.[1]||'classic';
  const item={index:i+1,type,chars:body.length,offset:scripts[i].index};
  if(src){
    item.src=src;
    if(/^https?:\/\//i.test(src)){remoteScripts.push(item);continue;}
    if(/^\/\//.test(src)){remoteScripts.push(item);continue;}
    if(/^(data:|javascript:|\/)/i.test(src)){failures.push('不安全或不可审核的脚本路径：'+src);continue;}
    if(!fs.existsSync(path.join(root,src.split(/[?#]/)[0])))failures.push('缺失脚本：'+src);
    localScripts.push(item);
  }else{
    item.preview=body.trim().slice(0,100).replace(/\s+/g,' ');
    inlineScripts.push(item);
  }
}
// 第一批实际迁移必须保留原位置同步加载，防止格雷码控件绑定时序变化。
const grayPath='assets/chapters/ch01-gray-code.js';
const grayTag='<script src="'+grayPath+'"></script>';
const graySource=fs.readFileSync(path.join(root,grayPath),'utf8');
assert.ok(html.includes(grayTag),'格雷码同步脚本引用丢失');
assert.ok(graySource.includes('gcSlider')&&graySource.includes('gcGrayFlip'),'格雷码核心控件不完整');
assert.ok(!/<script[^>]*>[\\s\\S]*?第一章 · 格雷码[\\s\\S]*?<\\/script>/i.test(html),'格雷码不应重复内联');
// 第二章波形与真值表脚本必须保持同步加载，避免事件绑定失效。
const wavePath='assets/chapters/ch02-waveform.js';
const waveTag='<script src="'+wavePath+'"></script>';
const waveSource=fs.readFileSync(path.join(root,wavePath),'utf8');
assert.ok(html.includes(waveTag),'第二章波形脚本引用丢失');
assert.ok(waveSource.includes('wfSvg')&&waveSource.includes('wfEg2'),'波形控制器关键操作缺失');
assert.ok(!/<script[^>]*>[\\s\\S]*?第二章 · 波形图与真值表[\\s\\S]*?<\\/script>/i.test(html),'波形控制器不应重复内联');
// 三态门与总线控制器按原位置外置，避免同一控件绑定两次。
const triPath='assets/chapters/ch03-tristate-bus.js';
const triTag='<script src="'+triPath+'"></script>';
const triSource=fs.readFileSync(path.join(root,triPath),'utf8');
assert.equal(html.split(triTag).length-1,1,'三态门脚本必须且只能加载一次');
assert.ok(triSource.includes('triBus')&&triSource.includes('triClr')&&triSource.includes('triSvg'),'三态门控制器内容不完整');
const sections=[...html.matchAll(/<section\b[^>]*class=["'][^"']*\bmod\b[^"']*["'][^>]*\bid=["']([^"']+)["']/gi)].map(x=>x[1]);
assert.equal(sections.length,51,'V2.3 基线要求保留 51 个原始教学模块');
assert.equal(new Set(sections).size,51,'原始模块 id 不可重复');
assert.equal(failures.length,0,failures.join('\n'));
const metrics={
  htmlCharacters:html.length,
  originalModules:sections.length,
  scriptTags:scripts.length,
  localScriptCount:localScripts.length,
  remoteScriptCount:remoteScripts.length,
  inlineScriptCount:inlineScripts.length,
  inlineScriptCharacters:inlineScripts.reduce((n,x)=>n+x.chars,0),
  largestInlineScripts:inlineScripts.slice().sort((a,b)=>b.chars-a.chars).slice(0,12),
  localScripts,
  remoteScripts
};
const json=JSON.stringify(metrics,null,2);
if(process.argv.includes('--json'))console.log(json);
else{
  console.log('V2.4 工程审计通过：51 个模块均保留，本地引用脚本均存在。');
  console.log('HTML 字符数：'+metrics.htmlCharacters);
  console.log('剩余内联脚本：'+metrics.inlineScriptCount+' 个，字符合计 '+metrics.inlineScriptCharacters);
  console.log('外置脚本：本地 '+metrics.localScriptCount+' 个，远端 '+metrics.remoteScriptCount+' 个');
  console.log('建议优先审核的大型内联脚本（索引/字符数/类型）：');
  metrics.largestInlineScripts.forEach(x=>console.log('#'+x.index+' / '+x.chars+' / '+x.type+' / '+x.preview));
}
