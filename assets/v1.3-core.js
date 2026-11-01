/* V1.3：纯逻辑电路模型，不依赖浏览器，可以用 Node.js 测试。 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DigitalCircuit = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const SPECS = Object.freeze({
    SWITCH: {name:'输入开关',inputs:0,output:true},
    AND: {name:'与门 AND',inputs:2,output:true},
    OR: {name:'或门 OR',inputs:2,output:true},
    NOT: {name:'非门 NOT',inputs:1,output:true},
    XOR: {name:'异或 XOR',inputs:2,output:true},
    NAND: {name:'与非 NAND',inputs:2,output:true},
    NOR: {name:'或非 NOR',inputs:2,output:true},
    LED: {name:'输出灯 LED',inputs:1,output:false}
  });
  const MAX_NODES = 80, MAX_WIRES = 160;
  const newCircuit = () => ({version:1,nodes:[],wires:[]});
  const copy = c => ({version:1,nodes:c.nodes.map(n=>({...n})),wires:c.wires.map(w=>({...w}))});
  function validate(c){
    if(!c || c.version!==1 || !Array.isArray(c.nodes) || !Array.isArray(c.wires)) throw Error('文件不是受支持的 V1.3 电路结构');
    if(c.nodes.length>MAX_NODES || c.wires.length>MAX_WIRES) throw Error('电路规模超限（80 元件／160 连线）');
    const ids = new Set();
    for(const n of c.nodes){
      if(!n || typeof n.id!=='string' || !/^n[1-9]\d{0,7}$/.test(n.id) || ids.has(n.id))throw Error('元件 ID 重复或无效');
      ids.add(n.id);
      if(!SPECS[n.type] || !Number.isFinite(n.x) || !Number.isFinite(n.y) || n.x<0 || n.y<0 || n.x>5000 || n.y>5000)throw Error('元件类型或位置无效');
      if(n.type==='SWITCH' && n.value!==0 && n.value!==1)throw Error('开关值必须为 0 或 1');
    }
    const ports=new Set();
    for(const w of c.wires){
      if(!w||typeof w.from!=='string'||typeof w.to!=='string'||!Number.isInteger(w.port))throw Error('无效连线');
      const a=c.nodes.find(n=>n.id===w.from),b=c.nodes.find(n=>n.id===w.to);
      if(!a||!b||!SPECS[a.type].output||w.port<0||w.port>=SPECS[b.type].inputs)throw Error('连接端口不合法');
      const portKey=w.to+':'+w.port;
      if(ports.has(portKey))throw Error('同一个输入端最多只能接一根线');
      ports.add(portKey);
    }
    // Kahn 拓扑法判断组合逻辑环；本版本不模拟反馈锁存器或时序元件。
    const indeg=new Map(c.nodes.map(n=>[n.id,0])),adj=new Map(c.nodes.map(n=>[n.id,[]]));
    for(const w of c.wires){indeg.set(w.to,indeg.get(w.to)+1);adj.get(w.from).push(w.to);}
    const queue=c.nodes.filter(n=>indeg.get(n.id)===0).map(n=>n.id);
    let processed=0;
    for(let p=0;p<queue.length;p++){processed++;for(const to of adj.get(queue[p])){indeg.set(to,indeg.get(to)-1);if(indeg.get(to)===0)queue.push(to);}}
    if(processed!==c.nodes.length)throw Error('存在逻辑反馈环路，V1.3 仅支持无环组合电路');
    return true;
  }
  function addNode(c,type,x=80,y=80){
    validate(c);if(!SPECS[type])throw Error('不支持的元件类型');
    if(c.nodes.length>=MAX_NODES)throw Error('元件数量已达上限');
    const out=copy(c);let i=1;while(out.nodes.some(n=>n.id==='n'+i))i++;
    out.nodes.push({id:'n'+i,type,x:Math.max(0,Math.min(5000,Math.round(x))),y:Math.max(0,Math.min(5000,Math.round(y))),...(type==='SWITCH'?{value:0}:{})});
    return out;
  }
  function moveNode(c,id,x,y){validate(c);const out=copy(c),node=out.nodes.find(n=>n.id===id);if(!node)throw Error('元件不存在');node.x=Math.max(0,Math.min(5000,Math.round(x)));node.y=Math.max(0,Math.min(5000,Math.round(y)));return out;}
  function toggleSwitch(c,id){validate(c);const out=copy(c),node=out.nodes.find(n=>n.id===id);if(!node||node.type!=='SWITCH')throw Error('请选择输入开关');node.value=node.value===1?0:1;return out;}
  function removeNode(c,id){validate(c);const out=copy(c);out.nodes=out.nodes.filter(n=>n.id!==id);out.wires=out.wires.filter(w=>w.from!==id&&w.to!==id);return out;}
  function disconnect(c,to,port){validate(c);const out=copy(c);out.wires=out.wires.filter(w=>!(w.to===to&&w.port===port));return out;}
  function connect(c,from,to,port){
    validate(c);
    if(typeof port!=='number'||!Number.isInteger(port))throw Error('端口索引无效');
    const out=copy(c);out.wires=out.wires.filter(w=>!(w.to===to&&w.port===port));out.wires.push({from,to,port});
    validate(out);return out;
  }
  function calculate(type,inputs){
    if(inputs.some(v=>v===null))return null;
    const [a,b]=inputs;
    switch(type){
      case 'AND':return a&b;case 'OR':return a|b;case 'NOT':return 1-a;
      case 'XOR':return a^b;case 'NAND':return 1-(a&b);case 'NOR':return 1-(a|b);
      case 'LED':return a;default:return null;
    }
  }
  function evaluate(c){
    validate(c);
    const nodes=new Map(c.nodes.map(n=>[n.id,n]));
    const values=new Map(),pending=new Set(c.nodes.map(n=>n.id)),inputs=new Map();
    while(pending.size){
      let progressed=false;
      for(const id of [...pending]){
        const n=nodes.get(id);const wires=c.wires.filter(w=>w.to===id);
        if(wires.some(w=>!values.has(w.from)))continue;
        const args=Array(SPECS[n.type].inputs).fill(null);
        wires.forEach(w=>{args[w.port]=values.get(w.from);});
        const result=n.type==='SWITCH'?n.value:calculate(n.type,args);
        inputs.set(id,args);values.set(id,result);pending.delete(id);progressed=true;
      }
      if(!progressed)throw Error('无法完成逻辑求值');
    }
    const out={};for(const [id,value] of values)out[id]={value,inputs:inputs.get(id)};
    return out;
  }
  function truthTable(c){
    validate(c);
    const switches=c.nodes.filter(n=>n.type==='SWITCH'),outputs=c.nodes.filter(n=>n.type==='LED');
    if(switches.length>4)throw Error('真值表最多支持 4 个开关（16 行）');
    if(!switches.length||!outputs.length)throw Error('请先添加开关与 LED');
    const rows=[];
    for(let code=0;code<Math.pow(2,switches.length);code++){
      const instance=copy(c);const inputBits=switches.map((_,i)=>(code>>(switches.length-i-1))&1);
      switches.forEach((sw,i)=>{instance.nodes.find(n=>n.id===sw.id).value=inputBits[i];});
      const data=evaluate(instance);rows.push({inputs:inputBits,outputs:outputs.map(n=>data[n.id].value)});
    }
    return {switches:switches.map(n=>n.id),outputs:outputs.map(n=>n.id),rows};
  }
  function example(name){
    let c=newCircuit();
    const at=(type,x,y,value)=>{c=addNode(c,type,x,y);const id=c.nodes[c.nodes.length-1].id;if(type==='SWITCH'&&value)c=toggleSwitch(c,id);return id;};
    if(name==='halfAdder'){
      const a=at('SWITCH',70,120),b=at('SWITCH',70,340),xor=at('XOR',370,150),and=at('AND',370,360),sum=at('LED',740,150),carry=at('LED',740,360);
      c=connect(c,a,xor,0);c=connect(c,b,xor,1);c=connect(c,a,and,0);c=connect(c,b,and,1);c=connect(c,xor,sum,0);c=connect(c,and,carry,0);
    }else if(name==='and'){
      const a=at('SWITCH',70,120),b=at('SWITCH',70,340),gate=at('AND',395,230),led=at('LED',760,230);
      c=connect(c,a,gate,0);c=connect(c,b,gate,1);c=connect(c,gate,led,0);
    }else throw Error('示例名称无效');
    return c;
  }
  return Object.freeze({SPECS,newCircuit,validate,addNode,moveNode,toggleSwitch,removeNode,disconnect,connect,evaluate,truthTable,example});
});