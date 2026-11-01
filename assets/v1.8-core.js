/* V1.8 零基础微型实验的纯计算内核。
 * 仅用于教学演示：真实芯片电气指标与器件规格须核对数据手册。 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DigitalV18Lab=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function int(n,min,max,name){
 if(!Number.isInteger(n)||n<min||n>max)throw Error((name||'输入')+'超出范围');
 return n;
}
function binary(value,width=8){
 int(value,0,255,'二进制数值');int(width,1,8,'位数');
 if(value>=Math.pow(2,width))throw Error('当前位数不能表示这个数');
 const bits=Array.from({length:width},(_,index)=>Math.floor(value/Math.pow(2,width-index-1))%2);
 return {bits,weights:bits.map((_,i)=>Math.pow(2,width-i-1)),decimal:value,hex:value.toString(16).toUpperCase().padStart(Math.ceil(width/4),'0')};
}
function gate(type,a,b){
 if(!['AND','OR','NOT','XOR'].includes(type))throw Error('不支持的逻辑门');
 int(a,0,1,'A');int(b,0,1,'B');
 const output=type==='AND'?a&b:type==='OR'?a|b:type==='NOT'?1-a:a^b;
 return {type,a,b,output};
}
function cmos(a){return {input:int(a,0,1,'输入'),output:1-a,conducting:a===0?'PMOS 上拉':'NMOS 下拉',other:a===0?'NMOS 截止':'PMOS 截止'};}
function adder(a,b){
 int(a,0,1,'A');int(b,0,1,'B');
 return {a,b,sum:a^b,carry:a&b,result:a+b};
}
function newDff(){return {D:0,Q:0,edges:0};}
function setDff(s,value){
 if(!s||!Number.isInteger(s.edges)||!([0,1].includes(s.D))||!([0,1].includes(s.Q)))throw Error('DFF 状态损坏');
 return {...s,D:int(value,0,1,'D')};
}
function clockDff(s){
 if(!s||![0,1].includes(s.D)||![0,1].includes(s.Q)||!Number.isInteger(s.edges)||s.edges<0||s.edges>9999)throw Error('DFF 状态损坏');
 if(s.edges>=9999)throw Error('时钟记录上限，请复位');
 return {...s,Q:s.D,edges:s.edges+1};
}
function counter(n,modulus=6){
 int(modulus,2,16,'模数');int(n,0,modulus-1,'当前计数');
 return {value:n,modulus,next:(n+1)%modulus,bits:Math.max(1,Math.ceil(Math.log2(modulus))),binary:n.toString(2).padStart(Math.max(1,Math.ceil(Math.log2(modulus))),'0')};
}
function tickCounter(n,modulus=6){return counter(counter(n,modulus).next,modulus);}
function timer555(r1k,r2k,cnf){
 if(![r1k,r2k,cnf].every(Number.isFinite)||r1k<=0||r2k<=0||cnf<=0||r1k>1000||r2k>1000||cnf>100000)throw Error('参数须为正，电阻≤1000 kΩ、电容≤100000 nF');
 const tHigh=0.693*(r1k+r2k)*1000*cnf*1e-9;
 const tLow=0.693*r2k*1000*cnf*1e-9;
 const period=tHigh+tLow;
 return {tHigh,tLow,period,frequency:1/period,duty:tHigh/period*100};
}
function adc(bits,vref,vin){
 if(![8,10,12].includes(bits)||!Number.isFinite(vref)||vref<=0||vref>5||!Number.isFinite(vin)||vin<0||vin>vref)throw Error('ADC 参数不合法');
 const levels=2**bits,step=vref/levels,code=Math.min(levels-1,Math.floor(vin/step));
 return {bits,levels,step,code,restored:code*step,error:vin-code*step,codeBinary:code.toString(2).padStart(bits,'0')};
}
return Object.freeze({binary,gate,cmos,adder,newDff,setDff,clockDff,counter,tickCounter,timer555,adc});
});
