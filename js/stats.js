(() => {
  const Lab = window.Patrol;
  const mean = values => values.length ? values.reduce((a,b) => a + b, 0) / values.length : null;
  const diff = (a,b) => a === null || b === null ? null : a - b;
  const sum = values => values.reduce((a,b) => a + b, 0);
  function metric(trials) {
    const valid = trials.filter(t => Number(t.valid) === 1);
    const correct = valid.filter(t => Number(t.correct) === 1 && t.rt != null && Number.isFinite(Number(t.rt)));
    const misses = valid.filter(t => t.outcome === 'miss').length;
    const wrong = valid.filter(t => t.outcome === 'wrong').length;
    return { n: valid.length, acc: mean(valid.map(t => Number(t.correct))), rt: mean(correct.map(t => Number(t.rt))),
      misses, wrong, unreported: valid.length ? (misses + wrong) / valid.length : null };
  }
  function monitorLayout(rows) {
    const valid = rows.filter(t => Number(t.valid) === 1);
    const seen = valid.filter(t => t.eye_mode === 'webgazer');
    const samples = sum(seen.map(t => Number(t.gaze_samples) || 0));
    const hits = [1,2,3,4].map(i => sum(seen.map(t => Number(t['gaze_cam' + i]) || 0)));
    const inWindows = sum(hits);
    const high = (rows[0]?.high_windows || '').split(',').map(Number).filter(i => i >= 1 && i <= 4);
    // 每种布局至少 80 个区内样本，且至少一半回调落在实际画面内。
    const eyeValid = inWindows >= 80 && inWindows >= samples * .5 && new Set(high).size === 2;
    return {
      falseAlarms: sum(valid.map(t => Number(t.false_alarms) || 0)), n: valid.length,
      samples, inWindows, high, shares: hits.map(n => eyeValid ? n / inWindows : null),
      highShare: eyeValid ? sum(high.map(i => hits[i-1])) / inWindows : null
    };
  }
  function summarize(kind, trials) {
    const formal = trials.filter(t => t.phase === 'formal' && t.version === Lab.config.version);
    const cells = Object.fromEntries(Object.keys(Lab.config.cells[kind]).map(key => [key, metric(formal.filter(t => t.cond === key))]));
    const rt = key => cells[key].rt;
    const effects = {};
    const layouts = {};
    if (kind === 'seev') {
      const adj = cells.adjacent_high;
      const diag = cells.diagonal_high;
      for (const layout of Object.keys(Lab.layoutLabels)) layouts[layout] = monitorLayout(formal.filter(t => t.layout === layout));
      effects.high_unreported = diff(adj.unreported, diag.unreported);
      effects.high_miss = diff(adj.n ? adj.misses / adj.n : null, diag.n ? diag.misses / diag.n : null);
      effects.high_wrong = diff(adj.n ? adj.wrong / adj.n : null, diag.n ? diag.wrong / diag.n : null);
      effects.high_rt = diff(adj.rt,diag.rt);
      effects.eye = diff(layouts.adjacent.highShare,layouts.diagonal.highShare);
    } else {
      effects.zh = diff(rt('incongruent_zh'), rt('congruent_zh'));
      effects.en = diff(rt('incongruent_en'), rt('congruent_en'));
      effects.emotion = diff(rt('negative'), rt('neutral'));
      effects.language = diff(effects.zh, effects.en);
    }
    return { overall: metric(formal), cells, effects, layouts };
  }
  function analyze(kind, records) {
    const participants = new Map();
    for (const record of records) {
      const key = record.participant;
      if (typeof key !== 'string' || participants.has(key) || !Lab.data.validSeries(kind,record.trials,'formal')) continue;
      const summary = summarize(kind, record.trials);
      if (summary.overall.n) participants.set(key, summary);
    }
    return [...participants.values()];
  }
  Lab.stats = { mean, summarize, analyze };
})();
