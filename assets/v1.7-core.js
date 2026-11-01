/* V1.7 项目实训核心：七段数码管、交通灯有限状态机、电子时钟。
 * 本模块只模拟理想逻辑，不模拟硬件驱动电流、扫描占空比和晶振漂移。
 */
(function(host,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else host.DigitalProjects=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const MASKS=Object.freeze([0x3f,0x06,0x5b,0x4f,0x66,0x6d,0x7d,0x07,0x7f,0x6f,0x77,0x7c,0x39,0x5e,0x79,0x71]);
 const SYMBOLS=Object.freeze(['0','1','2','3','4','5','6','7','8','9','A','b','C','d','E','F']);
 const PHASES=Object.freeze([
  {id:'NS_GREEN',label:'南北通行',seconds:10,ns:'green',ew:'red'},
  {id:'NS_YELLOW',label:'南北黄灯',seconds:3,ns:'yellow',ew:'red'},
  {id:'ALL_RED_EW',label:'全红缓冲 → 东西',seconds:2,ns:'red',ew:'red'},
  {id:'EW_GREEN',label:'东西通行',seconds:10,ns:'red',ew:'green'},
  {id:'EW_YELLOW',label:'东西黄灯',seconds:3,ns:'red',ew:'yellow'},
  {id:'ALL_RED_NS',label:'全红缓冲 → 南北',seconds:2,ns:'red',ew:'red'}
 ]);
 const HISTORY=60;
 const validInt=(x,min,max)=>Number.isInteger(x)&&x>=min&&x<=max;
 const clone=x=>JSON.parse(JSON.stringify(x));
 const digit=(value)=>{if(!validInt(value,0,15))throw Error('数码管输入必须为 0～15 的整数');return {value,symbol:SYMBOLS[value],mask:MASKS[value],bits:Array.from({length:7},(_,i)=>(MASKS[value]>>i)&1)};};
 function fresh(){
  return {version:1,seven:{value:0},traffic:{phase:0,remaining:PHASES[0].seconds,elapsed:0,cycles:0,history:[]},clock:{hour:12,minute:0,second:0,elapsed:0,history:[]}};
 }
 function validate(s){
  if(!s||typeof s!=='object'||s.version!==1||!s.seven||!s.traffic||!s.clock)throw Error('不是有效的 V1.7 实验记录');
  if(!validInt(s.seven.value,0,15))throw Error('数码管数据不正确');
  const t=s.traffic,c=s.clock;
  if(!validInt(t.phase,0,PHASES.length-1)||!validInt(t.remaining,1,PHASES[t.phase].seconds)||!validInt(t.elapsed,0,1000000)||!validInt(t.cycles,0,1000000))throw Error('交通灯状态错误');
  if(!validInt(c.hour,0,23)||!validInt(c.minute,0,59)||!validInt(c.second,0,59)||!validInt(c.elapsed,0,1000000))throw Error('电子时钟状态错误');
  for(const [list,type] of [[t.history,'traffic'],[c.history,'clock']]){
   if(!Array.isArray(list)||list.length>HISTORY)throw Error('实验历史超限');
   let prev=-1;
   for(const row of list){
    if(!row||!validInt(row.elapsed,1,1000000)||row.elapsed<=prev||row.elapsed>(type==='traffic'?t.elapsed:c.elapsed))throw Error('时间历史不合法');
    if(type==='traffic'&&(!validInt(row.phase,0,5)||!validInt(row.remaining,1,PHASES[row.phase].seconds)))throw Error('信号灯历史不合法');
    if(type==='clock'&&(!validInt(row.hour,0,23)||!validInt(row.minute,0,59)||!validInt(row.second,0,59)))throw Error('时钟历史不合法');
    prev=row.elapsed;
   }
  }
  return true;
 }
 const record=(arr,item)=>{arr.push(item);if(arr.length>HISTORY)arr.shift();};
 function setDigit(s,value){validate(s);digit(value);const out=clone(s);out.seven.value=value;return out;}
 function lampState(s){validate(s);const p=PHASES[s.traffic.phase];return {phase:p.id,label:p.label,ns:p.ns,ew:p.ew,remaining:s.traffic.remaining};}
 function trafficStep(s){
  validate(s);if(s.traffic.elapsed>=1000000)throw Error('实验最多支持 100 万模拟秒，请复位');
  const out=clone(s),t=out.traffic;t.elapsed++;
  if(t.remaining>1)t.remaining--;
  else {t.phase=(t.phase+1)%PHASES.length;t.remaining=PHASES[t.phase].seconds;if(t.phase===0)t.cycles++;}
  record(t.history,{elapsed:t.elapsed,phase:t.phase,remaining:t.remaining});
  return out;
 }
 function resetTraffic(s){validate(s);const out=clone(s);out.traffic=fresh().traffic;return out;}
 function timeString(s){validate(s);const c=s.clock;return [c.hour,c.minute,c.second].map(n=>String(n).padStart(2,'0')).join(':');}
 function setTime(s,h,m,sec){
  validate(s);
  if(!validInt(h,0,23)||!validInt(m,0,59)||!validInt(sec,0,59))throw Error('时间必须在 00:00:00～23:59:59 之间');
  const out=clone(s);out.clock={hour:h,minute:m,second:sec,elapsed:0,history:[]};return out;
 }
 function clockStep(s){
  validate(s);if(s.clock.elapsed>=1000000)throw Error('实验最多支持 100 万模拟秒，请重新设置时间');
  const out=clone(s),c=out.clock;c.elapsed++;
  const total=(c.hour*3600+c.minute*60+c.second+1)%86400;
  c.hour=Math.floor(total/3600);c.minute=Math.floor(total%3600/60);c.second=total%60;
  record(c.history,{elapsed:c.elapsed,hour:c.hour,minute:c.minute,second:c.second});return out;
 }
 function resetClock(s){return setTime(s,12,0,0);}
 const trafficTable=()=>PHASES.map((p,i)=>({index:i,id:p.id,label:p.label,duration:p.seconds,ns:p.ns,ew:p.ew,next:PHASES[(i+1)%PHASES.length].id}));
 const segmentTable=()=>SYMBOLS.map((symbol,i)=>({input:i,symbol,mask:MASKS[i],bits:digit(i).bits}));
 function assertSafeTraffic(s){
  const {ns,ew}=lampState(s);
  return !(ns==='green'&&ew==='green')&&!(ns==='yellow'&&ew==='yellow')&&!(ns==='green'&&ew==='yellow')&&!(ns==='yellow'&&ew==='green');
 }
 function checkpoints(s){
  validate(s);const l=lampState(s);
  return {
   digit:{pass:digit(s.seven.value).bits.reduce((n,v)=>n+v,0)>0,explanation:'译码结果至少有一个点亮段'},
   traffic:{pass:assertSafeTraffic(s),explanation:'南北与东西不能同时放行'},
   clock:{pass:validInt(s.clock.hour,0,23)&&validInt(s.clock.minute,0,59)&&validInt(s.clock.second,0,59),explanation:'时钟在 24 小时制范围内'}
  };
 }
 return Object.freeze({MASKS,SYMBOLS,PHASES,HISTORY,fresh,validate,digit,setDigit,lampState,trafficStep,resetTraffic,timeString,setTime,clockStep,resetClock,trafficTable,segmentTable,assertSafeTraffic,checkpoints});
});