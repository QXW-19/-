/* 零依赖的 V1.2 教材内容结构验收脚本。
 * 用法：node tests/verify-v1.2.cjs
 * 仅验证静态结构、数据范围和明确列出的示例计算；
 * 不替代浏览器端到端测试、教材审校或 3D/WebGL 测试。
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const html = read('数字电子技术基础-互动课堂.html');
const dataSource = read('assets/v1.2-content.js');
const renderer = read('assets/v1.2.js');
const css = read('assets/v1.2.css');
const v11 = read('assets/v1.1.js');
vm.compileFunction(dataSource, []);
vm.compileFunction(renderer, []);
vm.compileFunction(v11, []);
const sandbox = {window: {}};
vm.runInNewContext(dataSource, sandbox, {timeout: 1000});
const data = sandbox.window.DIGITAL_COURSE_V12;
assert.equal(data.length, 8, '必须覆盖八个教材章节');
const original = [...html.matchAll(/<section class="mod" id="([^"]+)"/g)].map(x => x[1]);
assert.equal(original.length, 51, '原 51 个教学页面模块不可被删减');
const moduleIds = new Set(original);
const names = new Set();
for (const [index, ch] of data.entries()) {
  assert.equal(ch.id, 'c' + (index + 1), '章节顺序不一致');
  assert.ok(moduleIds.has(ch.id), ch.id + ' 正文模块缺失');
  assert.ok(!names.has(ch.id), '重复章节');
  names.add(ch.id);
  assert.ok(ch.title && ch.prereq && ch.usecase, '章节导学内容不可空');
  assert.equal(ch.goals.length, 3);
  assert.equal(ch.principles.length, 3);
  for (const item of ch.principles) {
    for (const key of ['name','body','key','pitfall']) assert.ok(item[key], ch.id + ':' + key + ' 缺失');
  }
  assert.equal(ch.worked.steps.length, 4);
  assert.ok(ch.worked.question && ch.worked.conclusion);
  assert.equal(ch.lab.actions.length, 3);
  assert.ok(moduleIds.has(ch.lab.experiment), ch.id + ' 实验入口不存在：' + ch.lab.experiment);
  assert.equal(ch.checks.length, 2);
  ch.checks.forEach((q, i) => {
    assert.ok(q.q && q.why, ch.id + ' 第' + i + '题内容不能为空');
    assert.equal(q.options.length, 3);
    assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 3, '正确答案索引无效');
    assert.equal(new Set(q.options).size, 3, '同题选项不能重复');
  });
}
for (const url of ['assets/v1.1.js','assets/v1.2-content.js','assets/v1.2.js','assets/v1.2.css']) {
  assert.ok(html.includes(url), 'HTML 未引用资源：' + url);
}
assert.ok(html.indexOf('assets/v1.2-content.js') < html.indexOf('assets/v1.2.js'), '数据必须先于渲染器加载');
assert.ok(css.includes('.v12-lessons') && renderer.includes('renderChapter'), 'V1.2 渲染器或样式缺失');
// 数学示例核对：8 位补码 -3、模 6 最低位数、555、10 位 ADC。
assert.equal((256 - 3).toString(2).padStart(8,'0'), '11111101');
assert.equal(Math.ceil(Math.log2(6)), 3);
const tHigh = 0.693*(10000+10000)*10e-9;
const tLow = 0.693*10000*10e-9;
assert.ok(Math.abs(1/(tHigh+tLow)/1000-4.81)<0.02, '555 频率计算不符');
assert.equal(Math.floor(1.65/(3.3/1024)),512,'ADC 例题码值不符');
console.log('PASS · V1.2 静态验收：8 章、24 专题、8 例题、8 实验任务、16 题。');
console.log('PASS · 原 51 个页面模块与 V1.1 资源仍存在。');
console.log('PASS · 代码语法、章节结构、实验入口与示例计算检查通过。');
console.log('注意：仍需在浏览器实际测试导航、答题、进度和 3D。');
