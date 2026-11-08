(() => {
  const Lab = window.Patrol;
  const { data, config, gaze, results, escape: esc } = Lab;
  const main = document.getElementById('main');
  const tasks = {
    seev: { num: '01', title: '城市四屏监控', name: 'W5 SEEV · 可选眼动', color: 'ice', art: 'city-v2',
      description: '盯住四路摄像头。发现像素小怪时，报告它出现的窗口。', alt: '蓝灰色像素城市的静态摄像头画面' },
    stroop: { num: '02', title: '破解错色怪', name: '中英情绪 Stroop', color: 'pink',
      description: '破解文字与墨色的冲突，比较中文、英文和情绪词。', alt: '莓莓用色卡追踪释放彩墨的错色怪' }
  };
  let session = data.load();
  let prep = null;
  let calibratedSize = '';
  let scene = 0;
  let running = false;
  const busyUploads = new Set();
  const busyChecks = new Set();
  const btn = (action, label, cls = 'primary', extra = '') => `<button type="button" class="${cls}" data-action="${action}" ${extra}>${label}</button>`;
  const flag = label => `<span class="eyebrow"><span aria-hidden="true">✦</span> ${label}</span>`;
  const asset = (name, alt = '') => `<img src="./assets/${name}.webp" alt="${alt}">`;
  const panel = (kicker,title,body) => `<section class="panel">${flag(kicker)}<h1>${title}</h1>${body}</section>`;
  const taskAttr = kind => `data-kind="${kind}"`;
  const complete = kind => session?.runs[kind]?.status === 'complete';
  const steps = step => `<div class="steps" aria-label="参与步骤">${['知情同意','匿名编号','任务主界面'].map((s,i) => `<span ${step===i+1?'aria-current="step"':''}>0${i+1} <b>${s}</b></span>`).join('')}</div>`;
  const keys = kind => kind === 'seev' ?
    Lab.monitorKeys.map((key, i) => `<span><kbd>${key}</kbd> ${Lab.monitorNames[i]}</span>`).join('') :
    Lab.colors.map(c => `<span><i class="ink-dot" style="background:${c.hex}" aria-hidden="true"></i>${c.label}<kbd>${c.key.toUpperCase()}</kbd></span>`).join('');
  const hasRows = () => Object.values(session.runs).some(run => run.trials.length > 0);
  function setPage(name, html, quiet = false) {
    document.body.dataset.page = name;
    scene++;
    document.body.classList.toggle('quiet', quiet);
    main.className = quiet ? 'quiet-main' : 'site-main';
    main.innerHTML = (!quiet && config.test ? '<div class="test-banner">测试模式 · 记录使用 test_ 实验名</div>' : '') + html;
    window.scrollTo(0,0);
    main.focus({ preventScroll: true });
    return scene;
  }
  function card(kind, interactive) {
    const task = tasks[kind];
    const run = session?.runs[kind];
    const locked = kind === 'stroop' && !complete('seev');
    const tag = interactive ? complete(kind) ? '已完成' : locked ? '待解锁' : run ? '进行中' : '可开始' : task.name;
    return `<article class="mission ${task.color}"><div class="mission-art">${asset(task.art || kind,task.alt)}<span class="mission-no">MISSION ${task.num}</span></div>
      <div class="mission-content"><div><span class="chip">${tag}</span><h3>${task.title}</h3><p>${task.description}</p></div>
      ${interactive ? locked ? '<span class="lock">完成任务 01 后解锁</span>' :
        btn('mission',complete(kind)?'查看结果 ↗':run?'继续任务 →':'进入任务 →','secondary small',taskAttr(kind)) : '<span class="card-arrow" aria-hidden="true">↗</span>'}</div></article>`;
  }
  function home() {
    gaze.stop();
    setPage('home', `<section class="hero">
      <div class="hero-copy">${flag('VOL.02 / ATTENTION EXPERIMENT')}
        <h1 class="wordmark">${asset('wordmark','ATTENTION')}</h1>
        <p class="hero-kicker"><span></span> 千禧年注意实验室</p>
        <h2>注意巡警<span>✦</span></h2>
        <p class="hero-text">城市的注意信号被两只分心怪搅乱了。<br>和五名巡警一起出动，完成两项实验，恢复城市通讯。</p>
        <div class="actions">${btn('start',session?'继续巡逻 <span>→</span>':'开始巡逻 <span>→</span>')}${btn('about','参与说明','secondary')}</div>
        <p class="hero-meta">◈ 约 8–10 分钟 <span>·</span> 实体键盘 <span>·</span> 摄像头可选</p>
      </div>
      <div class="hero-art">${asset('hero','莱姆、泡泡、闪闪、莓莓和苏打围着复古通讯器集结')}<span class="art-label">✦ CITY SIGNAL PATROL</span></div>
      </section><div class="signal-strip"><span>✦ &nbsp; SIGNAL CHECK</span><span>01 / SEEV</span><span>02 / STROOP</span><span>▂ ▄ ▆ ▇</span></div>
      <section class="home-missions" aria-labelledby="mission-title"><div class="section-head"><div>${flag('MISSION SELECT')}<h2 id="mission-title">两场巡逻任务</h2></div><span class="section-meta">01 → 02 / CITY MAP</span></div>
      <div class="mission-grid">${card('seev',false)}${card('stroop',false)}</div></section>
      <section class="team panel"><div>${flag('PATROL TEAM')}<h2>巡警全员集合</h2><p>莱姆 · 泡泡 · 闪闪 · 莓莓 · 苏打</p></div>${asset('team','从左到右为戴星形发夹的莱姆、戴粉色耳机的泡泡、戴蓝色雷达镜的闪闪、戴紫色方镜的莓莓和背着闪电工具包的苏打')}</section>`);
  }
  function consent(info = false) {
    gaze.stop();
    prep = null;
    setPage('consent', steps(1) + panel('01 / CONSENT','参与说明与知情同意', `<p class="lede">这是工程心理学课程的注意实验，观察监控布局、色词一致性及词语情绪与作答表现的关系。</p>
      <ul class="rules"><li><strong>参与内容</strong>　四屏监控 40 次正式异常、中英情绪 Stroop 30 个正式试次，另有短练习和组间休息。练习仅提供即时反馈。情绪模块包含如「担心」一类的负性词。</li>
      <li><strong>自愿参加</strong>　你可在任一休息页离开，答题时按 Esc 可暂停。已完成并确认上传的记录由课程后台保存。未完成的实验可下载本机记录。</li>
      <li><strong>匿名数据</strong>　使用匿名编号。完整任务的条件、按键、反应时、正确性与可选眼动区域摘要提交到课程服务器，用于课程分析和全体匿名结果。</li>
      <li><strong>摄像头可选</strong>　启用前会单独征求同意。画面和原始视线坐标只在当前设备处理，离开四屏监控时关闭摄像头。</li></ul>
      <div class="notice">请用带实体键盘的电脑，保持页面前台并尽量减少通知和打扰。</div>
      ${info && session ? `<div class="actions">${btn('lobby','返回任务主界面 →')}${btn('home','返回首页','secondary')}</div>` :
      `<form id="consent-form"><label class="check"><input type="checkbox" required> 我已阅读上述说明，自愿参与并同意按说明使用匿名数据。</label><div class="actions"><button class="primary">同意并继续 →</button>${btn('home','返回首页','secondary')}</div></form>`}`));
  }
  function participant() {
    setPage('participant', steps(2) + panel('02 / PATROL ID','填写匿名编号', `<p class="lede">若邀请者已分配编号，请填写该编号。两项实验沿用同一个编号。</p>
      <form id="id-form"><label class="field">参与编号<input id="participant-id" maxlength="20" pattern="[A-Za-z0-9]{3,20}" required autocomplete="off" placeholder="例如 P005"></label>
      <p class="muted">3–20 位字母或数字。请使用分配编号或随机编号。</p>
      <div class="actions"><button class="primary">确认并进入 →</button>${btn('random','生成随机编号','secondary')}${btn('about','返回说明','plain')}</div></form>`));
  }
  function lobby() {
    gaze.stop();
    if (!session) return consent();
    prep = null;
    const hasRuns = hasRows();
    setPage('lobby', steps(3) + `<section class="section-head"><div>${flag('03 / MISSION SELECT')}<h1>巡逻任务台</h1><p>莱姆发来简报。城市通讯的两段信号需要依次恢复。</p></div><span class="chip">编号 ${esc(session.participant)}</span></section>
      <div class="mission-grid">${card('seev',true)}${card('stroop',true)}</div><div class="actions">
      ${complete('stroop') ? btn('finish','查看最终记录 →') : ''}
      ${hasRuns ? btn('export-json','下载本机 JSON','secondary') + btn('export-csv','下载本机 CSV','secondary') : ''}
      ${btn('reset','更换参与者','plain')}</div>`);
  }
  function briefing(kind) {
    if (complete(kind)) return showResult(kind);
    if (kind === 'stroop' && !complete('seev')) return lobby();
    gaze.stop();
    const task = tasks[kind];
    const run = session.runs[kind];
    const detail = kind === 'seev' ?
      '<p>同时监看四屏。小怪出现时，立即按对应的数字键。空窗按键算误报。<strong>高优先级窗口漏报的代价更高</strong>，也请留意普通窗口。</p><p>先做 5 次短练习，再完成两段正式监控。每段约 56 秒，中间可以休息。</p>' :
      '<p>先看中央十字。文字出现后，请判断<strong>字实际呈现的颜色</strong>。例如，<strong style="color:#2459bd">红</strong>实际是蓝色，按 G。色块和键位会一直显示在刺激区下方。</p><p>中文、英文和情绪模块各有 4 道短练习及 10 道正式题。</p>';
    const camera = kind === 'seev' ? `<div class="notice"><strong>可选摄像头眼动</strong><p>估计你在四个屏幕区域的注视。启用后会先校准和验证。你也可直接用按键完成。</p></div>
      <label class="check"><input type="checkbox" id="eye-consent"> 我同意开启摄像头，画面在本机处理，并提交匿名四区域摘要。</label>` :
      (!run ? '<label class="field">英语颜色词熟悉程度（选填）<select id="english"><option value="">跳过</option><option value="low">较不熟悉</option><option value="medium">一般</option><option value="high">熟悉</option></select></label>' : '');
    const keyboard = btn('keyboard',run?'继续按键作答 →':kind==='seev'?'使用按键版 →':'开始练习 →','primary',taskAttr(kind));
    setPage('briefing', `<section class="panel briefing"><div>${flag('MISSION ' + task.num + ' / BRIEFING')}<h1>${task.title}</h1><p class="lede">${task.name}</p>${detail}
      <div class="keyline">${keys(kind)}</div>${camera}
      <div class="actions">${keyboard}${kind === 'seev' ? btn('camera','开启摄像头并校准','secondary',taskAttr(kind)+' disabled id="eye-start"') : ''}${btn('lobby','返回任务台','plain')}</div>
      <p id="camera-status" role="status" class="muted"></p></div><figure>${asset(task.art || kind,task.alt)}${kind === 'seev' ? asset('ghost-v2','青柠色像素小怪') : asset('monsters','闪点怪与错色怪贴纸')}</figure></section>`);
  }
  function enter(kind, eyes) {
    if (!eyes) gaze.stop();
    prep = { kind, practiced: new Set(), familiarity: document.getElementById('english')?.value || null };
    const next = progress(kind);
    if (!next) return finishRun(kind);
    if (next.offset || (kind === 'seev' && next.i > 0)) return between(kind);
    playPractice(kind);
  }
  const sleep = ms => new Promise(resolve => setTimeout(resolve,ms));
  function arenaShell(title, note, kind, high = []) {
    const cams = Lab.monitorKeys.map((key,i) => `<div class="cam">
      <div class="cam-top"><span>CAM 0${key}</span><span class="priority">${high.includes(i+1) ? '高优先' : '普通'}</span></div>
      <div class="cam-picture"><img class="cam-city" src="./assets/city-v2.webp" alt="">
      <img class="cam-ghost" src="./assets/ghost-v2.webp" alt="异常" hidden></div></div>`).join('');
    const body = kind === 'seev' ? `<div class="monitor-grid">${cams}</div><div id="cal-layer"></div>` : '';
    return `<section class="experiment"><div class="experiment-head"><strong>${title}</strong><span>${note}</span></div>
      <div id="arena" class="arena ${kind === 'seev' ? 'monitor' : 'stroop-arena'}" aria-label="刺激区域">${body}</div></section>`;
  }
  async function calibrate() {
    const status = document.getElementById('camera-status');
    const button = document.getElementById('eye-start');
    button.disabled = true;
    status.textContent = '正在等待浏览器授权及模型启动……';
    const entered = scene;
    try {
      await gaze.start();
    } catch (error) {
      if (scene === entered) {
        const mediaErrors = {
          NotAllowedError: '摄像头授权被拒绝。可在浏览器设置中重试，或继续按键版。',
          NotFoundError: '没有找到可用摄像头。可以继续按键版。',
          NotReadableError: '摄像头暂时无法读取。请检查是否被占用，或继续按键版。'
        };
        status.textContent = mediaErrors[error.name] || error.message || '摄像头启动失败。可重试或使用按键版。';
        button.disabled = !document.getElementById('eye-consent').checked;
      }
      return;
    }
    if (scene !== entered) return;
    const page = setPage('calibrate', arenaShell('眼动校准','保持头部稳定，每个点注视并点击 5 次','seev') +
      `<div class="experiment-foot" id="calibration-actions">${btn('brief-seev','返回任务简报','secondary small')}${btn('keyboard','继续按键版','secondary small',taskAttr('seev'))}</div>`, true);
    const arena = document.getElementById('arena');
    const layer = document.getElementById('cal-layer');
    const training = [16,50,84].flatMap(y => [13,50,87].map(x => [x,y]));
    for (const [x,y] of training) {
      if (page !== scene) return;
      await new Promise(resolve => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'cal-dot';
        dot.style.left = x + '%';
        dot.style.top = y + '%';
        dot.textContent = '5';
        dot.setAttribute('aria-label','凝视并点击校准点 5 次');
        layer.replaceChildren(dot);
        let count = 0;
        let last = 0;
        const check = setInterval(() => { if (page !== scene) { clearInterval(check); resolve(); } }, 200);
        dot.onclick = () => {
          if (performance.now() - last < 180) return;
          last = performance.now();
          const rect = dot.getBoundingClientRect();
          gaze.train(rect.left+rect.width/2,rect.top+rect.height/2);
          dot.textContent = 5 - ++count;
          if (count === 5) { clearInterval(check); resolve(); }
        };
      });
    }
    if (page !== scene) return;
    layer.replaceChildren();
    const head = document.querySelector('.experiment-head');
    head.firstElementChild.textContent = '独立验证';
    head.lastElementChild.textContent = '只注视圆点，无需点击';
    const pictures = [...arena.querySelectorAll('.cam-picture')];
    const scores = [];
    const size = [innerWidth,innerHeight].join(',');
    for (const [q,picture] of pictures.entries()) {
      if (page !== scene) return;
      const rects = pictures.map(p => p.getBoundingClientRect());
      const { left, top, width, height } = picture.getBoundingClientRect();
      const bounds = layer.getBoundingClientRect();
      const x = left + width/2 - bounds.left;
      const y = top + height/2 - bounds.top;
      layer.innerHTML = `<span class="cal-dot" style="left:${x}px;top:${y}px"></span>`;
      let n = 0, hit = 0;
      const at = performance.now();
      gaze.listen((point,t) => {
        if (t - at < 500 || !point || document.hidden) return;
        n++;
        hit += Number(gaze.region(point, rects) === q);
      });
      await sleep(1900);
      if (page !== scene) return;
      gaze.listen(null);
      scores.push(n >= 10 && hit / n >= .60);
    }
    if (page !== scene) return;
    const passed = scores.filter(Boolean).length;
    if (passed === 4 && size === [innerWidth,innerHeight].join(',')) {
      calibratedSize = size;
      return enter('seev',true);
    }
    gaze.stop();
    setPage('eye-failed',panel('EYE TRACKING','四区域验证未通过',`<p>本次有 ${passed} / 4 个区域达到阈值。你可以调整光线或坐姿后重试，也可以继续按键版。</p>
      <div class="actions">${btn('brief-seev','返回并重新校准')}${btn('keyboard','继续按键版','secondary',taskAttr('seev'))}</div>`));
  }

  function progress(kind) {
    const run = session.runs[kind];
    const blocks = Lab.blocks(kind, session.participant);
    const count = run?.trials.length ?? 0;
    let preceding = 0;
    for (const [i,block] of blocks.entries()) {
      if (count < preceding + block.count) return { i, block, offset: count - preceding, total: blocks.length };
      preceding += block.count;
    }
    return null;
  }
  function between(kind, { practiceEnd = false, interrupted = false } = {}) {
    const next = progress(kind);
    if (!next) return finishRun(kind);
    const count = session.runs[kind]?.trials.length ?? 0;
    const requiresPractice = !next.offset && !prep?.practiced.has(next.block.id) && (kind === 'stroop' || next.i === 0);
    const heading = interrupted ? '实验已暂停' : practiceEnd ? '练习结束' : count === 0 ? '准备正式作答' : '巡逻休息站';
    const message = interrupted ? '准备好后可以继续，已保存的正式记录会保留。' :
      practiceEnd ? '接下来进入正式阶段。' : '放松一下眼睛，准备好再继续。';
    setPage('rest',panel('MISSION ' + tasks[kind].num + ' / CHECKPOINT',heading,`
      <p class="lede">${message}</p>
      <p>正式进度 ${count} / ${config.totals[kind]} · 下一组 ${next.i+1} / ${next.total} · ${next.block.name}</p><div class="keyline">${keys(kind)}</div>
      <div class="actions">${btn(requiresPractice?'practice':'play',requiresPractice?'开始本组练习 →':'继续正式作答 →','primary',taskAttr(kind))}
      ${btn('lobby',count?'返回任务台并保留记录':'退出到任务台','secondary')}</div>`));
  }
  function showTask(kind, next, practice) {
    const title = (practice ? '练习' : '正式作答 · 第 ' + (next.i+1) + ' 组') + ' · ' + next.block.name;
    setPage('trial', arenaShell(title,'',kind,next.block.high) +
      `<div class="task-controls"><div class="task-keybar" aria-label="键位提示">${keys(kind)}</div>
      <div class="experiment-foot"><span>Esc 暂停</span><span id="feedback" role="status"></span></div></div>`,true);
    return {
      arena: document.getElementById('arena'),
      counter: document.querySelector('.experiment-head span'),
      feedback: document.getElementById('feedback')
    };
  }
  async function readyMonitor(arena) {
    try {
      await Promise.all([...arena.querySelectorAll('img')].map(img => img.decode()));
      return true;
    } catch {
      return false;
    }
  }
  function monitorAssetError(kind) {
    setPage('rest', panel('CAMERA FEED','监控素材加载失败',
      `<p>返回任务台后可重新进入。</p>${btn('lobby','返回任务台','secondary',taskAttr(kind))}`));
  }
  async function playPractice(kind) {
    if (running) return;
    const next = progress(kind);
    if (!next) return finishRun(kind);
    running = true;
    const { arena, counter, feedback } = showTask(kind,next,true);
    let paused = '';
    try {
      // 练习不创建运行编号、不调用正式入口、不订阅眼动，仅刷新当前提示。
      if (kind === 'seev') {
        counter.textContent = '5 次异常';
        if (!(await readyMonitor(arena))) return monitorAssetError(kind);
        paused = await Lab.runner.practiceMonitor(arena, text => { feedback.textContent = text; });
      } else {
        for (const [i,cue] of Lab.practiceStroop(next.block.id).entries()) {
          counter.textContent = (i+1) + ' / 4';
          const response = await Lab.runner.practiceWord(arena,cue);
          paused = response.paused;
          if (paused) break;
          feedback.textContent = response.feedback;
          await sleep(380);
          feedback.textContent = '';
        }
      }
    } finally {
      running = false;
    }
    if (kind === 'seev' && paused === 'resize') gaze.stop();
    if (!paused) prep.practiced.add(next.block.id);
    between(kind, { practiceEnd: !paused, interrupted: Boolean(paused) });
  }
  async function play(kind) {
    if (running) return;
    const nextBeforeStart = progress(kind);
    if (!nextBeforeStart) return finishRun(kind);
    if (!session.runs[kind]) {
      session.runs[kind] = data.newRun(kind, session);
      if (kind === 'stroop') session.runs[kind].familiarity = prep.familiarity;
      data.save(session);
    }
    const run = session.runs[kind];
    const next = progress(kind);
    if (kind === 'seev' && gaze.active() && calibratedSize !== [innerWidth,innerHeight].join(',')) gaze.stop();
    const { arena, counter } = showTask(kind,next,false);
    const list = Lab.design(kind,session.participant,run.id)[next.i].trials;
    const block = next.i + 1;
    let paused = '';
    running = true;
    try {
      if (kind === 'seev') {
        if (!(await readyMonitor(arena))) return monitorAssetError(kind);
        counter.textContent = next.offset + ' / ' + list.length;
        paused = await Lab.runner.formalMonitor(arena,list.slice(next.offset), row => {
          const index = run.trials.length % list.length;
          data.recordFormal(session,kind,{
            ...row, high_windows: next.block.high.join(','), planned_onset_ms: index * config.monitor.segment + row.delay
          },block);
          counter.textContent = (index+1) + ' / ' + list.length;
        });
      } else {
        for (let i = next.offset; i < list.length; i++) {
          counter.textContent = (i+1) + ' / ' + list.length;
          if (document.hidden || !document.hasFocus()) { paused = 'hidden'; break; }
          const result = await Lab.runner.formalWord(arena,list[i]);
          if (result.row) data.recordFormal(session,kind,{ ...result.row, english_familiarity: run.familiarity },block);
          paused = result.paused;
          if (paused) break;
          await sleep(210);
        }
      }
    } finally {
      running = false;
    }
    if (kind === 'seev' && paused === 'resize') gaze.stop();
    between(kind, { interrupted: Boolean(paused) });
  }
  function finishRun(kind) {
    const run = session.runs[kind];
    if (!data.validSeries(kind,run.trials,config.test?'test':'formal',true,run.id)) return lobby();
    gaze.stop();
    if (run.status === 'complete') return showResult(kind);
    run.status = 'complete';
    run.completed_at = new Date().toISOString();
    data.save(session);
    showResult(kind);
    if (!config.test) send(kind);
  }
  function showResult(kind) {
    const run = session.runs[kind];
    setPage('result',panel('MISSION ' + tasks[kind].num + ' / REPORT', tasks[kind].name + '结果',`
      <p class="lede">${kind === 'seev' ? '雷达信号已恢复。' : '色彩信号已恢复。'} 下面是你的正式作答记录。</p>
      ${results.status(run)}
      <div class="actions">${kind === 'seev' ? btn('mission','进入任务 02 →','primary',taskAttr('stroop')) : btn('finish','查看最终记录 →')}
      ${btn('export-csv','下载本场 CSV','secondary',taskAttr(kind))}${btn('export-json','下载本场 JSON','secondary',taskAttr(kind))}${btn('lobby','任务台','plain')}</div>
      ${results.person(kind,run)}`));
    updateReceipts();
  }
  function finalPage() {
    if (!complete('stroop')) return lobby();
    setPage('finish',`<section class="panel briefing finale"><div>${flag('MISSION COMPLETE')}<h1>信号恢复<span aria-hidden="true"> ✦</span></h1><p class="lede">两场任务均已完成。通讯器上的城市信号重新亮了起来。</p>
      ${Object.keys(tasks).map(kind => `<h2>${tasks[kind].name}</h2>${results.status(session.runs[kind])}`).join('')}
      <div class="actions">${btn('export-csv','下载本人 CSV')}${btn('export-json','下载本人 JSON','secondary')}${btn('group','查看全体匿名结果','secondary')}${btn('lobby','任务台','plain')}</div>
      </div><figure>${asset('finish','五位巡警围着信号恢复的通讯器庆祝')}</figure></section>`);
    updateReceipts();
  }
  function updateReceipts() {
    for (const node of document.querySelectorAll('[data-receipt]')) {
      const kind = node.dataset.receipt;
      if (!session?.runs[kind]) continue;
      node.outerHTML = results.status(session.runs[kind]);
      if (busyUploads.has(kind)) {
        const receipt = document.querySelector('[data-receipt="' + kind + '"]');
        receipt.querySelector('strong').textContent = '正在提交课程服务器……';
        receipt.querySelector('button')?.setAttribute('disabled','');
      }
    }
  }
  async function send(kind) {
    if (busyUploads.has(kind) || !session) return;
    busyUploads.add(kind);
    try { await data.submit(session,kind,updateReceipts); }
    finally { busyUploads.delete(kind); updateReceipts(); }
  }
  async function verify(kind) {
    if (busyChecks.has(kind)) return;
    busyChecks.add(kind);
    let message;
    try { message = await data.verify(session,kind); }
    catch { message = '暂时无法核验。请保留本机备份。'; }
    finally { busyChecks.delete(kind); }
    updateReceipts();
    const node = document.querySelector('[data-receipt="' + kind + '"] .verify-note');
    if (node) node.textContent = message;
  }
  async function group() {
    gaze.stop();
    const current = setPage('group', panel('FIELD REPORT / GROUP DATA','全体匿名结果',`
      <p class="lede">先按被试计算配对差值，再汇总。页面只展示组水平统计和匿名个体点。</p>
      <div class="actions">${btn('group','重新读取','secondary')}${btn(session?'lobby':'home','返回','plain')}</div>
      ${Object.keys(tasks).map(kind => `<section class="group-result" id="group-${kind}"><h2>${tasks[kind].name}</h2><p role="status">正在读取课程服务器……</p></section>`).join('')}
      <section class="group-result"><h2>与经典研究对照</h2><p>四屏监控比较高优先级窗口在交错与相邻布局中的表现，并观察空窗时的视线分配。色词模块比较一致和不一致条件。情绪模块报告负性词减中性词的差值。由于刺激、语言熟练度、区组方式和设备不同，反应时量级需要结合任务设计解释。</p></section>`));
    await Promise.all(Object.keys(tasks).map(async kind => {
      let content;
      try { content = results.group(kind,await data.readAll(kind)); }
      catch { content = `<h2>${tasks[kind].name}</h2><p class="notice">暂时无法读取服务器数据。请检查网络后重新读取。</p>`; }
      if (current === scene) document.getElementById('group-'+kind).innerHTML = content;
    }));
  }
  function reset() {
    if (busyUploads.size || busyChecks.size) return;
    setPage('reset',panel('NEW PATROL ID','更换参与者',`<p>先下载当前编号的记录，再开始新的知情同意流程。</p><div class="actions">
      ${hasRows() ? btn('export-json','下载本机 JSON','secondary') + btn('export-csv','下载本机 CSV','secondary') : ''}
      ${btn('confirm-reset','确认更换')}${btn('lobby','返回任务台','plain')}</div>`));
  }
  document.addEventListener('submit', event => {
    event.preventDefault();
    if (event.target.id === 'consent-form') participant();
    if (event.target.id === 'id-form') {
      const participantId = document.getElementById('participant-id').value.trim().toUpperCase();
      if (!/^[A-Z0-9]{3,20}$/.test(participantId)) return;
      session = data.create(participantId);
      data.save(session);
      lobby();
    }
  });
  document.addEventListener('change', event => {
    if (event.target.id === 'eye-consent') document.getElementById('eye-start').disabled = !event.target.checked;
  });
  const actions = {
    home, about: () => consent(true), start: () => session ? lobby() : consent(), lobby, mission: briefing,
    'brief-seev': () => briefing('seev'), keyboard: kind => enter(kind,false), camera: calibrate,
    play, practice: playPractice,
    finish: finalPage, group, reset,
    'confirm-reset': () => { session = null; data.save(null); consent(); },
    'export-csv': kind => data.exportRuns(session,'csv',kind), 'export-json': kind => data.exportRuns(session,'json',kind),
    send, verify,
    random: () => { document.getElementById('participant-id').value = ('P'+data.id().slice(0,7)).toUpperCase(); }
  };
  document.addEventListener('click', event => {
    const target = event.target.closest('button[data-action]');
    if (target && !running) actions[target.dataset.action]?.(target.dataset.kind);
  });
  home();
})();

