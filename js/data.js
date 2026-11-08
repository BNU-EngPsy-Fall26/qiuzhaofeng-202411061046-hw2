(() => {
  const Lab = window.Patrol;
  const { config } = Lab;
  const storageKey = 'attention-patrol-' + config.version + (config.test ? '-test' : '');
  let storageOK = true;
  function load() {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch {
      storageOK = false;
      return null;
    }
  }
  function save(session) {
    try {
      const stored = session && JSON.parse(localStorage.getItem(storageKey));
      // 同一运行的旧页面保存试次时，保留另一个页面已经写入的更新回执。
      if (stored?.consent_at === session?.consent_at && session) {
        for (const [kind, run] of Object.entries(session.runs)) {
          const previous = stored.runs[kind];
          if (previous?.id === run.id && (previous.upload.revision || 0) > (run.upload.revision || 0)) {
            run.upload = previous.upload;
          }
        }
      }
      localStorage.setItem(storageKey, JSON.stringify(session));
      storageOK = true;
    } catch {
      storageOK = false;
    }
  }
  function id() {
    return [...crypto.getRandomValues(new Uint8Array(6))].map(n => n.toString(16).padStart(2, '0')).join('');
  }
  function create(participant) {
    return { participant, consent_at: new Date().toISOString(), version: config.version, test: config.test, runs: {} };
  }
  function experiment(kind, test = config.test) {
    return (test ? 'test_' : '') + config.experiments[kind];
  }
  function newRun(kind, session) {
    const runId = id();
    return { kind, id: runId, status: 'incomplete', upload: { state: 'local' }, trials: [] };
  }
  // 练习没有写入入口。所有正式行在这里盖协议、来源和从 1 开始的序号。
  function recordFormal(session, kind, row, block) {
    const run = session.runs[kind];
    const n = run.trials.length;
    if (run.status !== 'incomplete' || n >= config.totals[kind] || !Object.hasOwn(config.cells[kind], row.cond)) {
      throw Error('正式记录与协议不符');
    }
    run.trials.push({
      ...row, phase: 'formal', run_id: run.id, version: config.version, trial_no: n + 1,
      record_mode: config.test ? 'test' : 'formal', block
    });
    save(session);
  }
  // 下载、POST 和全体统计共同校验来源、协议、顺序及各条件数量。
  function validSeries(kind, rows, mode, whole = true, runId = rows?.[0]?.run_id) {
    const totals = config.cells[kind];
    if (!Array.isArray(rows) || !runId || !rows.length || rows.length > config.totals[kind] ||
        (whole && rows.length !== config.totals[kind])) return false;
    const counts = {};
    return rows.every((row, i) => {
      if (!row || row.phase !== 'formal' || row.version !== config.version || row.record_mode !== mode ||
          row.run_id !== runId || Number(row.trial_no) !== i + 1 || !Object.hasOwn(totals, row.cond)) return false;
      counts[row.cond] = (counts[row.cond] || 0) + 1;
      return counts[row.cond] <= totals[row.cond];
    });
  }
  async function readAll(kind, test = false) {
    const query = new URLSearchParams({ project: config.projects[kind], experiment: experiment(kind, test) });
    const response = await fetch(config.server + '/api/hw2/data?' + query, { cache: 'no-store', signal: AbortSignal.timeout(12000) });
    const result = await response.json();
    if (!response.ok || !Array.isArray(result.records)) throw Error(result.msg || '无法读取全体结果');
    return result.records.filter(record => !record.experiment || record.experiment === experiment(kind, test));
  }
  function receipt(run, next) {
    run.upload = { ...next, revision: Math.max(Date.now(), (run.upload.revision || 0) + 1) };
  }
  async function submit(session, kind, onChange) {
    const run = session.runs[kind];
    const send = () => postRun(session, kind, onChange);
    if (navigator.locks?.request) return navigator.locks.request('attention-upload-' + run.id, send);
    return send();
  }
  async function postRun(session, kind, onChange) {
    const run = session.runs[kind];
    const latest = load()?.runs[kind];
    if (latest?.id === run.id && (latest.upload.revision || 0) >= (run.upload.revision || 0)) run.upload = latest.upload;
    if (run.status !== 'complete' || !['local', 'rejected'].includes(run.upload.state)) return;
    if (!validSeries(kind, run.trials, config.test ? 'test' : 'formal', true, run.id)) {
      receipt(run, { state: 'local', message: '记录来源或数量与正式协议不符，无法提交。' });
      save(session);
      onChange();
      return;
    }
    // 发出请求前先持久化 pending。刷新后的 pending 必须走只读核验。
    receipt(run, { state: 'pending' });
    save(session);
    onChange();
    if (!storageOK) {
      receipt(run, { state: 'local', message: '浏览器无法保存上传状态。请下载本机备份。' });
      onChange();
      return;
    }
    try {
      const response = await fetch(config.server + '/api/hw2/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          project: config.projects[kind], participant: session.participant, experiment: experiment(kind),
          condition: kind === 'seev' ? (run.trials.some(t => t.eye_mode === 'webgazer') ? 'webgazer' : 'keyboard') : '',
          trials: run.trials
        })
      });
      const result = await response.json();
      if (response.ok && result.ok) {
        receipt(run, { state: 'sent', record_id: result.record_id, warnings: result.warnings, warning_details: result.warning_details });
      } else {
        const rejected = response.status >= 400 && response.status < 500 && result.ok === false;
        receipt(run, { state: rejected ? 'rejected' : 'unknown', message: result.msg || result.error || '课程服务器未确认保存。' });
      }
    } catch {
      receipt(run, { state: 'unknown', message: '连接中断或请求超时。请先核验服务器是否保存。' });
    }
    save(session);
    onChange();
  }
  async function verify(session, kind) {
    const run = session.runs[kind];
    const records = await readAll(kind, config.test);
    const match = records.find(r => validSeries(kind, r.trials, config.test ? 'test' : 'formal', true, run.id));
    if (match) {
      receipt(run, { state: 'sent', record_id: match.record_id, message: '已用运行编号核验。' });
      save(session);
      return '已核验到完整记录。';
    }
    return '暂未查到完整记录。请保留备份，由项目负责人核对后台。';
  }
  function download(name, type, content) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  function exportRuns(session, format, kind) {
    const mode = config.test ? 'test' : 'formal';
    const runs = Object.values(session.runs).filter(r => (!kind || r.kind === kind) &&
      validSeries(r.kind, r.trials, mode, r.status === 'complete', r.id));
    if (!runs.length) return;
    const suffix = runs.every(r => r.status === 'complete') ? 'complete' : 'incomplete';
    const name = ['attention', session.participant, kind, config.test && 'test', suffix].filter(Boolean).join('-');
    const clean = runs.map(run => ({ ...run, experiment: experiment(run.kind), project: config.projects[run.kind] }));
    if (format === 'json') {
      const { runs: stored, ...meta } = session;
      download(name + '.json', 'application/json', JSON.stringify({ ...meta, runs: clean }, null, 2));
      return;
    }
    const rows = clean.flatMap(run => run.trials.map(trial => ({
      participant: session.participant, experiment: run.experiment, run_status: run.status, upload_state: run.upload.state, ...trial
    })));
    const keys = [...new Set(['participant', 'experiment', 'run_status', 'upload_state', ...rows.flatMap(Object.keys)])];
    const cell = value => '"' + String(value ?? '').replace(/"/g, '""') + '"';
    const csv = [keys, ...rows.map(row => keys.map(key => row[key]))].map(row => row.map(cell).join(',')).join('\r\n');
    download(name + '.csv', 'text/csv;charset=utf-8', '\uFEFF' + csv);
  }
  Lab.data = { load, save, create, newRun, recordFormal, validSeries, storageOK: () => storageOK, id, readAll, submit, verify, exportRuns };
})();
