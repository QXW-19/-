/* V2.2 课程资源目录与安全搜索核心（无 DOM、无外部依赖）。
 * 保留原始 51 教学页面，目录只是汇总入口，不迁移学习进度。 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DigitalV22Catalog=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const KEY='digital-course-v2.2-resources';
const CATEGORIES=Object.freeze([
 {id:'all',label:'全部资源'},
 {id:'lesson',label:'系统讲义'},
 {id:'experiment',label:'互动实验'},
 {id:'reference',label:'教材精讲与速查'},
 {id:'exercise',label:'练习与考试'},
 {id:'three-d',label:'3D 可视化'}
]);
const VALID=new Set(CATEGORIES.map(c=>c.id).filter(x=>x!=='all'));
const FAV_MAX=100,RECENT_MAX=12;
function normalize(value){
 return String(value??'').normalize('NFKC').toLocaleLowerCase('zh-CN')
 .replace(/[\u200b-\u200d\ufeff]/g,'').replace(/[\s_–—|·,，、.。:：;；/\\()[\]【】《》<>!?？!]+/g,'');
}
function sectionCategory(id){
 if(/^w[1-5]$/.test(id))return 'three-d';
 if(/^x[1-8]$/.test(id)||id==='z1'||/exam|quiz|wrong/.test(id))return 'exercise';
 if(/^c[1-8]$/.test(id)||/^g[1-8]$/.test(id)||/^t[12]$/.test(id)||id==='v17-beginner'||id==='v18-school')return 'reference';
 if(id==='v19-studio')return 'exercise';
 if(id==='v20-home')return 'reference';
 return 'experiment';
}
function sectionChapter(id,subtitle){
 const m=/^[cgmnxw]([1-8])$/.exec(id); // 不用于 n9/n10/n11 的特殊模块。
 if(m&&id[0]!=='w')return Number(m[1]);
 const fixed={'n9':6,'n10':5,'n11':6,'v13-lab':4,'v14-lab':5,'v15-exam':null,'v16-lab':6,'v17-beginner':null,'v17-projects':null,'v18-school':null,'v19-studio':null};
 if(Object.prototype.hasOwnProperty.call(fixed,id))return fixed[id];
 if(/^w[2-5]$/.test(id))return ({w2:6,w3:3,w4:7,w5:8})[id];
 const s=String(subtitle||'');
 const ch=s.match(/第([一二三四五六七八])章/);
 if(ch)return '一二三四五六七八'.indexOf(ch[1])+1;
 return null;
}
function safeTitle(text){return String(text||'').replace(/\s+/g,' ').trim().slice(0,120);}
function build(items){
 if(!Array.isArray(items))throw Error('目录必须是数组');
 const ids=new Set(),result=[];
 for(const row of items){
  if(!row||typeof row!=='object')continue;
  const {id,kind,chapter,category}=row;
  if(typeof id!=='string'||!/^[\da-z-]{2,48}$/i.test(id)||ids.has(id)||!['module','lesson'].includes(kind))continue;
  if(!VALID.has(category))continue;
  if(chapter!==null&&(!Number.isInteger(chapter)||chapter<1||chapter>8))continue;
  const title=safeTitle(row.title),subtitle=safeTitle(row.subtitle);
  if(!title)continue;
  const key=kind+':'+id;ids.add(id);
  result.push(Object.freeze({key,id,kind,chapter,category,title,subtitle,searchText:normalize(title+' '+subtitle+' '+(chapter?'第'+chapter+'章':'')+' '+category)}));
 }
 return result;
}
function safeState(input){
 const out={version:1,favorites:[],recent:[]};
 if(!input||input.version!==1)return out;
 for(const [field,max]of [['favorites',FAV_MAX],['recent',RECENT_MAX]]){
  if(Array.isArray(input[field])){
   out[field]=[...new Set(input[field].filter(x=>typeof x==='string'&&/^(module|lesson):[\da-z-]{2,48}$/i.test(x)))].slice(0,max);
  }
 }
 return out;
}
function toggleFavorite(state,key){
 if(typeof key!=='string'||!/^(module|lesson):[\da-z-]{2,48}$/i.test(key))throw Error('无效资源编号');
 const out=safeState(state);
 if(out.favorites.includes(key))out.favorites=out.favorites.filter(x=>x!==key);
 else out.favorites=[key,...out.favorites].slice(0,FAV_MAX);
 return out;
}
function remember(state,key){
 if(typeof key!=='string'||!/^(module|lesson):[\da-z-]{2,48}$/i.test(key))throw Error('无效资源编号');
 const out=safeState(state);
 out.recent=[key,...out.recent.filter(x=>x!==key)].slice(0,RECENT_MAX);
 return out;
}
function filter(catalog,options={}){
 if(!Array.isArray(catalog))throw Error('没有有效课程目录');
 const q=normalize(String(options.query||'').slice(0,150));
 const category=CATEGORIES.some(c=>c.id===options.category)?options.category:'all';
 const chapter=Number.isInteger(options.chapter)&&options.chapter>=1&&options.chapter<=8?options.chapter:null;
 const saved=safeState(options.state),onlyFavorite=options.favorites===true;
 const favoriteSet=new Set(saved.favorites);
 const words=String(options.query||'').normalize('NFKC').trim().split(/\s+/).map(normalize).filter(Boolean);
 const matches=catalog.filter(row=>{
  if(category!=='all'&&row.category!==category)return false;
  if(chapter!==null&&row.chapter!==chapter)return false;
  if(onlyFavorite&&!favoriteSet.has(row.key))return false;
  return !q||row.searchText.includes(q)||words.length>1&&words.every(w=>row.searchText.includes(w));
 });
 const rank=row=>{
  let value=favoriteSet.has(row.key)?60:0;
  if(q&&normalize(row.title).includes(q))value+=40;
  if(row.kind==='lesson')value+=12;
  if(row.category==='reference')value+=8;
  return value;
 };
 // 保持同等排序稳定，避免每次切换条件时结果反复跳动。
 return matches.map((row,i)=>({row,i,score:rank(row)}))
 .sort((a,b)=>b.score-a.score||a.i-b.i).map(x=>x.row);
}
function stats(catalog){return CATEGORIES.slice(1).map(c=>({category:c.id,count:catalog.filter(x=>x.category===c.id).length}));}
return Object.freeze({KEY,CATEGORIES,normalize,sectionCategory,sectionChapter,build,safeState,toggleFavorite,remember,filter,stats});
});