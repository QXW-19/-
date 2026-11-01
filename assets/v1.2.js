/* V1.2 教材增强渲染器：所有文字用 textContent 创建，避免插入不受信任 HTML。 */
(function () {
  'use strict';
  const DATA = window.DIGITAL_COURSE_V12;
  if (!Array.isArray(DATA)) {
    console.warn('[V1.2] 增补教材数据未加载，请检查 v1.2-content.js。');
    return;
  }
  const STORE = 'digital-course-v1.2';
  const validIds = new Set(DATA.flatMap(ch => ch.checks.map((_, i) => ch.id + ':' + i)));
  let answers = {};
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || '{}');
    if (saved && saved.version === 1 && saved.answers && typeof saved.answers === 'object') {
      for (const [id, value] of Object.entries(saved.answers)) {
        if (validIds.has(id) && Number.isInteger(value) && value >= 0 && value <= 2) answers[id] = value;
      }
    }
  } catch (err) { console.warn('[V1.2] 旧练习记录读取失败', err); }
  const elem = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined && text !== null) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  function button(text, fn) {
    const b = elem('button', text, 'v12-btn'); b.type = 'button';
    b.addEventListener('click', fn); return b;
  }
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify({version: 1, answers})); }
    catch (err) { console.warn('[V1.2] 练习记录保存失败', err); }
  }
  function correctCount(ch) {
    let score = 0, attempted = 0;
    ch.checks.forEach((q, i) => {
      const a = answers[ch.id + ':' + i];
      if (a !== undefined) { attempted++; if (a === q.answer) score++; }
    });
    return {score, attempted};
  }
  function makeSection(label) {
    const section = elem('section', undefined, 'v12-block');
    section.append(elem('h3', label)); return section;
  }
  function renderChapter(ch) {
    const host = document.getElementById(ch.id);
    if (!host || document.getElementById('v12-' + ch.id)) return;
    const root = elem('section', undefined, 'v12-lessons');
    root.id = 'v12-' + ch.id;
    root.setAttribute('aria-label', ch.title + ' V1.2 增补课程');
    const head = elem('div', undefined, 'v12-head');
    const headings = elem('div');
    headings.append(elem('span', 'V1.2 · 章节拓展教材', 'v12-eyebrow'));
    headings.append(elem('h2', ch.title + ' · 知识扩展与实训'));
    headings.append(elem('p', '学习前建议：' + ch.prereq, 'v12-sub'));
    head.append(headings);
    head.append(elem('span', '3 个知识点 · 1 个例题 · 1 个任务 · 2 道检测', 'v12-chip'));
    root.append(head);
    const goals = makeSection('本节学习目标');
    const goalList = elem('ul', undefined, 'v12-goals');
    ch.goals.forEach(goal => goalList.append(elem('li', goal)));
    goals.append(goalList); root.append(goals);
    const theory = makeSection('知识精讲 · 重要概念与易错点');
    const cards = elem('div', undefined, 'v12-cards');
    ch.principles.forEach((p, index) => {
      const card = elem('article', undefined, 'v12-concept');
      card.append(elem('h4', (index + 1) + '. ' + p.name));
      card.append(elem('p', p.body));
      card.append(elem('div', '核心关系：' + p.key, 'v12-key'));
      card.append(elem('div', '⚠ 易错提醒：' + p.pitfall, 'v12-danger'));
      cards.append(card);
    });
    theory.append(cards); root.append(theory);
    const worked = makeSection('分步例题 · 先思考，再看推导');
    const workPanel = elem('div', undefined, 'v12-worked');
    workPanel.append(elem('h4', ch.worked.title));
    workPanel.append(elem('p', ch.worked.question, 'v12-note'));
    const steps = elem('ol', undefined, 'v12-steps');
    steps.setAttribute('aria-live', 'polite');
    const conclusion = elem('p', '结论：' + ch.worked.conclusion, 'v12-result v12-hidden');
    let shown = 0;
    const next = button('显示第 1 步', () => {
      if (shown < ch.worked.steps.length) {
        steps.append(elem('li', ch.worked.steps[shown]));
        shown++;
        next.textContent = shown < ch.worked.steps.length ? '显示第 ' + (shown + 1) + ' 步' : '已显示全部步骤';
        next.disabled = shown === ch.worked.steps.length;
        conclusion.classList.toggle('v12-hidden', shown < ch.worked.steps.length);
      }
    });
    const reset = button('重新推导', () => {
      shown = 0; steps.replaceChildren(); next.disabled = false;
      next.textContent = '显示第 1 步'; conclusion.classList.add('v12-hidden');
    });
    const actions = elem('div', undefined, 'v12-actions'); actions.append(next, reset);
    workPanel.append(steps, actions, conclusion); worked.append(workPanel); root.append(worked);
    const lab = makeSection('动手任务 · 结合已有互动实验');
    const labPanel = elem('div', undefined, 'v12-lab');
    labPanel.append(elem('h4', ch.lab.title));
    const labList = elem('ol');
    ch.lab.actions.forEach(step => labList.append(elem('li', step)));
    labPanel.append(labList);
    const labResult = elem('div', '观察标准：' + ch.lab.expected, 'v12-result');
    const labActions = elem('div', undefined, 'v12-actions');
    labActions.append(button('打开对应互动实验', () => {
      if (typeof window.show === 'function' && document.getElementById(ch.lab.experiment)) window.show(ch.lab.experiment);
      else window.alert('未找到对应的互动实验模块');
    }));
    labPanel.append(labActions, labResult); lab.append(labPanel); root.append(lab);
    const test = makeSection('本节知识检测 · 自动判分');
    const testPanel = elem('div', undefined, 'v12-check');
    const score = elem('p', '', 'v12-score');
    function updateScore() {
      const {score: points, attempted} = correctCount(ch);
      score.textContent = '已完成 ' + attempted + '/' + ch.checks.length + ' 题 · 当前正确 ' + points + ' 题（可重新作答）';
    }
    testPanel.append(score);
    ch.checks.forEach((q, index) => {
      const key = ch.id + ':' + index;
      const fieldset = elem('fieldset', undefined, 'v12-question');
      fieldset.style.border = '0'; fieldset.style.margin = '0'; fieldset.style.minWidth = '0'; fieldset.style.padding = '12px 0';
      fieldset.append(elem('legend', '第 ' + (index + 1) + ' 题：' + q.q));
      const name = 'v12-' + ch.id + '-q' + index;
      q.options.forEach((option, i) => {
        const label = elem('label', undefined, 'v12-choice');
        const input = elem('input');
        input.type = 'radio'; input.name = name; input.value = String(i);
        if (answers[key] === i) input.checked = true;
        label.append(input, elem('span', option)); fieldset.append(label);
      });
      const feedback = elem('p', '', 'v12-result'); feedback.setAttribute('aria-live', 'polite');
      function updateFeedback() {
        const value = answers[key];
        feedback.hidden = value === undefined;
        if (value !== undefined) {
          feedback.textContent = (value === q.answer ? '✓ 回答正确。' : '✗ 回答错误。正确答案：' + q.options[q.answer] + '。') + ' 解析：' + q.why;
        }
      }
      const submit = button('提交并查看解析', () => {
        const choice = fieldset.querySelector('input:checked');
        if (!choice) { feedback.hidden = false; feedback.textContent = '请先选择一个答案。'; return; }
        answers[key] = Number(choice.value);
        save(); updateFeedback(); updateScore();
      });
      fieldset.append(submit, feedback); testPanel.append(fieldset);
      updateFeedback();
    });
    updateScore();
    test.append(testPanel); root.append(test);
    const footer = elem('div', undefined, 'v12-footer');
    footer.append(elem('strong', '连接真实工程：'));
    footer.append(elem('span', ch.usecase));
    footer.append(elem('p', '说明：本增补为原创教学说明与理想模型演练，真实电路参数需查数据手册；V1.2 检测记录与 V1.1 学习记录分开保存。', 'v12-note'));
    root.append(footer);
    // 注入在原章标题下方；原有正文、原题库、实验入口全部保留。
    const oldHeader = host.querySelector('.mod-h');
    if (oldHeader) oldHeader.insertAdjacentElement('afterend', root);
    else host.insertBefore(root, host.firstChild);
    const link = button('定位到 V1.2 拓展', () => root.scrollIntoView({behavior:'smooth',block:'start'}));
    link.setAttribute('aria-label', ch.title + ' 跳转到 V1.2 新增内容');
    link.style.margin = '7px 0 0';
    if (oldHeader) oldHeader.append(link);
  }
  function exportProgress() {
    const json = JSON.stringify({version:1, answers}, null, 2);
    const url = URL.createObjectURL(new Blob([json], {type:'application/json'}));
    const link = document.createElement('a');
    link.href = url; link.download = '数字电子课程-V1.2-检测记录.json';
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  function addProgressTools() {
    const first = document.getElementById('v12-c1');
    if (!first) return;
    const tools = elem('div', undefined, 'v12-actions');
    tools.append(button('导出 V1.2 检测记录', exportProgress));
    const importer = elem('input'); importer.type = 'file'; importer.accept = '.json,application/json'; importer.hidden = true;
    importer.addEventListener('change', async () => {
      const file = importer.files?.[0]; if (!file) return;
      try {
        const parsed = JSON.parse(await file.text());
        if (!parsed || parsed.version !== 1 || !parsed.answers || typeof parsed.answers !== 'object' || Array.isArray(parsed.answers)) throw Error('不符合 V1.2 记录格式');
        const safe = {};
        for (const [id, value] of Object.entries(parsed.answers)) {
          if (validIds.has(id) && Number.isInteger(value) && value >= 0 && value <= 2) safe[id] = value;
        }
        if (window.confirm('导入会覆盖本机 V1.2 检测记录，继续吗？')) {
          answers = safe; save(); window.location.reload();
        }
      } catch (err) { window.alert('导入失败：' + err.message); }
      finally { importer.value = ''; }
    });
    tools.append(button('导入 V1.2 检测记录', () => importer.click()), importer);
    first.append(tools);
  }
  function start() {
    if (!Array.isArray(DATA) || DATA.length !== 8) { console.warn('[V1.2] 章节数不正确'); return; }
    DATA.forEach(renderChapter);
    addProgressTools();
    const title = document.querySelector('.v11-tools strong');
    if (title) title.textContent = '数字电子互动课堂 V1.2';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
