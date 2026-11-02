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
