/* V2.4 Playwright 专用本地静态服务（Windows / Linux 通用）。
 * 背景：Python 的 http.server 默认使用 HTTP/1.0 短连接，一轮回归会发起上千次连接，
 * 在 Windows 上容易堆积 TIME_WAIT 并触发 net::ERR_NO_BUFFER_SPACE，
 * 造成偶发的脚本加载失败。这里改用 Node 的 HTTP/1.1 keep-alive，仅服务仓库静态文件。
 * 不改动任何课程内容，也不接触用户个人文件。
 */
'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const port=Number(process.env.PORT||8001);
const MIME={
  '.html':'text/html; charset=utf-8',
  '.htm':'text/html; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.cjs':'text/javascript; charset=utf-8',
  '.mjs':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.svg':'image/svg+xml',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.ico':'image/x-icon',
  '.md':'text/plain; charset=utf-8'
};

const server=http.createServer((req,res)=>{
  let pathname;
  try{
    pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  }catch{
    res.writeHead(400,{'Content-Type':'text/plain; charset=utf-8'});
    res.end('Bad Request');
    return;
  }
  if(pathname==='/'||pathname==='')pathname='/index.html';
  // 规范化路径并阻止目录穿越，只允许读取仓库目录内的文件。
  const target=path.resolve(root,'.'+pathname);
  if(target!==root&&!target.startsWith(root+path.sep)){
    res.writeHead(403,{'Content-Type':'text/plain; charset=utf-8'});
    res.end('Forbidden');
    return;
  }
  fs.stat(target,(err,stat)=>{
    if(err||!stat.isFile()){
      res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});
      res.end('Not Found: '+pathname);
      return;
    }
    const type=MIME[path.extname(target).toLowerCase()]||'application/octet-stream';
    res.writeHead(200,{
      'Content-Type':type,
      'Content-Length':stat.size,
      'Cache-Control':'no-store',
      'Connection':'keep-alive',
      'Keep-Alive':'timeout=30, max=200'
    });
    if(req.method==='HEAD'){res.end();return;}
    fs.createReadStream(target).pipe(res);
  });
});

server.keepAliveTimeout=30000;
server.headersTimeout=35000;
server.listen(port,'127.0.0.1',()=>{
  console.log('[static-server] http://127.0.0.1:'+port+'/');
});
