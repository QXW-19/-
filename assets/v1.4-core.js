/* V1.4 同步时序教学模型：只模拟理想有效上升沿，不模拟门延迟与亚稳态。 */
(function (host, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else host.DigitalSequential = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const MODES = Object.freeze({D:'D 触发器',T:'T 触发器',JK:'JK 触发器',COUNTER:'同步模 N 计数器'});
  const LIMIT = 48;
  const bit = x => x === 0 || x === 1;
  const validInputs = a => a && typeof a === 'object' && ['D','T','J','K'].every(k=>bit(a[k]));
  const clone = s => JSON.parse(JSON.stringify(s));

  function create(mode='D',modulus=6) {
    if (!Object.prototype.hasOwnProperty.call(MODES,mode)) throw Error('未知模式');
    if (!Number.isInteger(modulus) || modulus<2 || modulus>16) throw Error('模数范围为 2～16');
    return {version:1,mode,modulus,q:0,count:0,tick:0,inputs:{D:0,T:1,J:1,K:1},history:[]};
  }
  function validate(s) {
    if (!s||typeof s!=='object'||s.version!==1||!Object.prototype.hasOwnProperty.call(MODES,s.mode))
      throw Error('不是有效的 V1.4 电路记录');
    if (!Number.isInteger(s.modulus)||s.modulus<2||s.modulus>16) throw Error('计数模数越界');
    if (!bit(s.q)||!Number.isInteger(s.count)||s.count<0||s.count>=s.modulus)throw Error('当前状态无效');
    if (!Number.isSafeInteger(s.tick)||s.tick<0||s.tick>1000000||!validInputs(s.inputs))throw Error('时钟或输入无效');
    if (!Array.isArray(s.history)||s.history.length>LIMIT)throw Error('波形记录超限');
    let last=-1;
    for(const row of s.history){
      if(!row||!Number.isSafeInteger(row.tick)||row.tick<1||row.tick>s.tick||row.tick<=last)
        throw Error('历史时钟顺序无效');
      if(!Object.prototype.hasOwnProperty.call(MODES,row.mode)||typeof row.before!=='number'||typeof row.after!=='number'
         ||!Number.isInteger(row.before)||!Number.isInteger(row.after)||row.before<0||row.after<0||row.before>15||row.after>15
         ||!validInputs(row.inputs)||typeof row.note!=='string'||row.note.length>150)throw Error('波形数据不合法');
      last=row.tick;
    }
    return true;
  }
  function setMode(s,mode) {validate(s);return create(mode,s.modulus);}
  function setModulus(s,modulus) {validate(s);return create(s.mode,modulus);}
  function setInput(s,name,value) {
    validate(s);
    if(!['D','T','J','K'].includes(name)||!bit(value))throw Error('输入端必须为 0 或 1');
    const out=clone(s);out.inputs[name]=value;return out;
  }
  function reset(s){validate(s);const out=clone(s);out.q=0;out.count=0;out.tick=0;out.history=[];return out;}
  function next(mode,now,inputs,modulus){
    if(mode==='D')return {value:inputs.D,why:'D 触发器在上升沿采样 D'};
    if(mode==='T')return {value:now ^ inputs.T,why:inputs.T?'T=1，Q 翻转':'T=0，Q 保持'};
    if(mode==='JK'){
      const {J,K}=inputs;
      if(!J&&!K)return {value:now,why:'J=0，K=0，保持'};
      if(!J&&K)return {value:0,why:'J=0，K=1，复位'};
      if(J&&!K)return {value:1,why:'J=1，K=0，置位'};
      return {value:1-now,why:'J=1，K=1，翻转'};
    }
    return {value:(now+1)%modulus,why:now===modulus-1?'到达 '+(modulus-1)+'，下一拍回到 0':'同步计数加 1'};
  }
  function step(s) {
    validate(s); if(s.tick>=1000000)throw Error('最大时钟步数已达到上限，请复位');
    const out=clone(s);
    const before=s.mode==='COUNTER'?s.count:s.q;
    const result=next(s.mode,before,s.inputs,s.modulus);
    if(s.mode==='COUNTER')out.count=result.value;else out.q=result.value;
    out.tick++;
    out.history.push({tick:out.tick,mode:s.mode,before,after:result.value,inputs:{...s.inputs},note:result.why});
    if(out.history.length>LIMIT)out.history.shift();
    return out;
  }
  function binary(n,width){return n.toString(2).padStart(width,'0');}
  function bits(s) {
    validate(s);
    return s.mode==='COUNTER'?binary(s.count,Math.max(1,Math.ceil(Math.log2(s.modulus)))):String(s.q);
  }
  function transitionTable(mode,modulus=6){
    if(!Object.prototype.hasOwnProperty.call(MODES,mode))throw Error('未知模式');
    if(!Number.isInteger(modulus)||modulus<2||modulus>16)throw Error('模数范围 2～16');
    if(mode==='D')return [0,1].map(D=>({current:'任意',input:'D='+D,next:String(D)}));
    if(mode==='T')return [0,1].flatMap(q=>[0,1].map(T=>({current:String(q),input:'T='+T,next:String(q^T)})));
    if(mode==='JK')return [0,1].flatMap(q=>[0,1].flatMap(J=>[0,1].map(K=>({current:String(q),input:'J='+J+' K='+K,next:String(next('JK',q,{J,K},modulus).value)}))));
    const width=Math.max(1,Math.ceil(Math.log2(modulus)));
    return Array.from({length:modulus},(_,q)=>({current:binary(q,width),input:'时钟上升沿',next:binary((q+1)%modulus,width)}));
  }
  return Object.freeze({MODES,LIMIT,create,validate,setMode,setModulus,setInput,reset,step,bits,transitionTable});
});