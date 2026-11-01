/* V1.1 学习功能独立模块，原实验代码不作修改。 */
(function(){'use strict';
const STORE='digital-course-v1.1', chapters=[['c1','数制和码制'],['c2','逻辑代数基础'],['c3','门电路'],['c4','组合逻辑电路'],['c5','半导体存储电路'],['c6','时序逻辑电路'],['c7','脉冲波形产生和整形'],['c8','数模和模数转换']];
const questions={
c1:[['二进制 1010 等于十进制多少？',['8','10','12'],1,'8+2=10'],['8 位无符号整数最大值？',['127','255','256'],1,'2⁸−1=255']],
c2:[['A+0 等于？',['0','A','1'],1,'或运算单位元是 0'],['A·A 等于？',['0','1','A'],2,'幂等律']],
c3:[['非门输入 1 输出？',['0','1','高阻态'],0,'非门反相'],['与门输出 1 的条件？',['任意输入 1','所有输入 1','所有输入 0'],1,'与运算要求均为 1']],
c4:[['异或门何时输出 1？',['输入相同','输入不同','总为 1'],1,'异或门输入不同时输出 1'],['半加器输出哪两项？',['和与进位','地址与数据','时钟与复位'],0,'半加器产生和与进位']],
c5:[['D 触发器有效时钟沿采样？',['D 输入','供电电压','输出负载'],0,'锁存输入 D'],['一个双稳态单元可存储？',['1 bit','8 bit','0 bit'],0,'双稳态单元存储一位']],
c6:[['模 4 计数器有效状态数？',['2','4','8'],1,'模 4 有四种计数状态'],['3 位二进制计数器状态数？',['3','6','8'],2,'2³=8']],
c7:[['无稳态多谐振荡器通常？',['持续振荡','恒定低电平','只响应一次'],0,'无稳态电路周期振荡'],['施密特触发器抗干扰依靠？',['滞回阈值','地址译码','寄存器'],0,'双阈值形成回差']],
c8:[['理想 8 位 ADC 有几个量化码？',['8','128','256'],2,'2⁸=256'],['ADC 量化分辨率主要受何影响？',['位数与输入范围','外壳颜色','供电线长度'],0,'由参考范围及量化位数决定']]};
const fresh=()=>({version:1,completed:[],answers:{},last:'c1',theme:'light',scale:1});
let state;try{state=JSON.parse(localStorage.getItem(STORE))||fresh()}catch(_){state=fresh()};
function sane(x){const d=fresh();if(!x||typeof x!=='object')return d;d.completed=Array.isArray(x.completed)?[...new Set(x.completed.filter(y=>chapters.some(c=>c[0]===y)))]:[];d.answers=x.answers&&typeof x.answers==='object'&&!Array.isArray(x.answers)?x.answers:{};d.last=typeof x.last==='string'&&document.getElementById(x.last)?x.last:'c1';d.theme=x.theme==='dark'?'dark':'light';d.scale=[.9,1,1.1,1.2].includes(x.scale)?x.scale:1;return d};state=sane(state);
function save(){try{localStorage.setItem(STORE,JSON.stringify(state))}catch(e){console.warn('进度存储不可用',e)}};
function node(tag,txt){const n=document.createElement(tag);if(txt!==undefined)n.textContent=txt;return n};
function button(txt,fn){const x=node('button',txt);x.type='button';x.onclick=fn;return x};
function active(){return document.querySelector('.mod.active')?.id||state.last};
function setting(){document.body.classList.toggle('v11-dark',state.theme==='dark');document.documentElement.style.fontSize=(16*state.scale)+'px';document.getElementById('v11-theme').textContent=state.theme==='dark'?'亮色模式':'深色模式';document.getElementById('v11-scale').value=state.scale};
function refresh(){const n=document.getElementById('v11-status'),bar=document.getElementById('v11-bar'),mark=document.getElementById('v11-mark'),wrong=document.getElementById('v11-wrong');if(!n)return;n.textContent='已完成 '+state.completed.length+'/8 章';bar.style.width=(state.completed.length/8*100)+'%';mark.textContent=state.completed.includes(active())?'取消完成标记':'标记本章完成';wrong.textContent='错题本（'+Object.values(state.answers).filter(v=>v&&v.correct===false).length+'）'};
function feedback(box,id,i,q){const answer=box.querySelector('.answer'),r=state.answers[id+'-'+i];answer.textContent=r?(r.correct?'回答正确。':'回答错误，正确答案：'+q[1][q[2]]+'。')+'解析：'+q[3]:'';if(r&&Number.isInteger(r.selected)){const inp=box.querySelector('input[value="'+r.selected+'"]');if(inp)inp.checked=true}};
function all(){refresh();document.querySelectorAll('.v11-q').forEach(box=>{const [id,i]=box.dataset.key.split(':');feedback(box,id,Number(i),questions[id][i])});renderWrong()};
function renderWrong(){const box=document.getElementById('v11-wrong-box');box.replaceChildren(node('h2','错题回顾'));let count=0;Object.entries(questions).forEach(([id,arr])=>arr.forEach((q,i)=>{const r=state.answers[id+'-'+i];if(r?.correct===false){count++;box.append(node('p',q[0]+'　正确答案：'+q[1][q[2]]+'。'+q[3]))}}));if(!count)box.append(node('p','目前没有错题记录。'))};
function start(){const main=document.getElementById('main');if(!main||typeof window.show!=='function')return;
const tools=node('div');tools.className='v11-tools';tools.append(node('strong','数字电子互动课堂 V1.1'));const status=node('span');status.id='v11-status';tools.append(status);
const theme=button('深色模式',()=>{state.theme=state.theme==='dark'?'light':'dark';save();setting()});theme.id='v11-theme';tools.append(theme);
const scale=node('select');scale.id='v11-scale';scale.setAttribute('aria-label','字体大小');[[.9,'小字'],[1,'默认'],[1.1,'较大'],[1.2,'大字']].forEach(([v,t])=>{const o=node('option',t);o.value=v;scale.append(o)});scale.onchange=()=>{state.scale=Number(scale.value);save();setting()};tools.append(scale);
tools.append(button('继续学习',()=>window.show(state.last)));
tools.append(button('导出记录',()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download='学习记录-v1.1.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}));
const file=node('input');file.type='file';file.accept='.json,application/json';file.hidden=true;file.onchange=async()=>{if(!file.files[0])return;try{const value=JSON.parse(await file.files[0].text());if(value.version!==1||!Array.isArray(value.completed)||!value.answers||typeof value.answers!=='object')throw Error('格式不正确');if(confirm('覆盖本地学习记录？')){state=sane(value);save();setting();all()}}catch(e){alert('导入失败：'+e.message)}file.value=''};tools.append(button('导入记录',()=>file.click()),file);
tools.append(button('清空记录',()=>{if(confirm('确定清空全部学习记录？')){state=fresh();save();setting();all()}}));main.insertBefore(tools,main.firstChild);
const panel=node('div');panel.className='v11-panel';panel.append(node('h2','学习进度'));const track=node('div');track.className='v11-track';const bar=node('span');bar.id='v11-bar';track.append(bar);panel.append(track);
const mark=button('标记本章完成',()=>{const id=active();if(!chapters.some(c=>c[0]===id)){window.show('c1');return}state.completed=state.completed.includes(id)?state.completed.filter(x=>x!==id):[...state.completed,id];save();refresh()});mark.id='v11-mark';panel.append(mark);
const wrong=button('错题本',()=>{const x=document.getElementById('v11-wrong-box');x.hidden=!x.hidden;renderWrong()});wrong.id='v11-wrong';panel.append(wrong);panel.append(node('p','章节完成需手动标记；记录仅保存在当前浏览器。'));main.insertBefore(panel,tools.nextSibling);
const wrongBox=node('div');wrongBox.id='v11-wrong-box';wrongBox.className='v11-panel';wrongBox.hidden=true;main.insertBefore(wrongBox,panel.nextSibling);
chapters.forEach(([id,name])=>{const sec=document.getElementById(id);if(!sec)return;const div=node('div');div.className='v11-panel';div.append(node('h2',name+' · 本章自测'));div.append(node('p','新增两道基础选择题，原考研习题保持不变。'));questions[id].forEach((q,i)=>{const b=node('div');b.className='v11-q';b.dataset.key=id+':'+i;b.append(node('p',(i+1)+'. '+q[0]));q[1].forEach((label,j)=>{const item=node('label'),input=node('input');input.type='radio';input.name='v11-'+id+'-'+i;input.value=j;item.append(input,document.createTextNode(' '+label));b.append(item)});const answer=node('div');answer.className='answer';b.append(button('提交答案',()=>{const chosen=b.querySelector('input:checked');if(!chosen){alert('请选择答案');return}const selected=Number(chosen.value);state.answers[id+'-'+i]={selected,correct:selected===q[2]};save();feedback(b,id,i,q);refresh();renderWrong()}),answer);div.append(b)});sec.append(div)});
const orig=window.show;window.show=function(id){const result=orig.apply(this,arguments);if(document.getElementById(id)){state.last=id;save();refresh()}return result};setting();all()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();