(() => {
  const Lab = window.Patrol;
  const e = Lab.escape;
  const fmt = (n, digits = 0) => n == null ? '—' : Number(n).toFixed(digits);
  const signed = (n, digits = 0) => n == null ? '—' : (n > 0 ? '+' : '') + fmt(n, digits);
  const ms = n => n == null ? '—' : fmt(n) + ' ms';
  const percent = n => n == null ? '—' : fmt(n * 100, 1) + '%';
  const delta = (n, unit = 'ms', scale = 1, digits = 0) => n == null ? '—' : signed(n * scale, digits) + ' ' + unit;
  const monitorOrder = Object.keys(Lab.config.cells.seev);
  const stroopOrder = ['congruent_zh','incongruent_zh','congruent_en','incongruent_en','neutral','negative'];
  const stroopLabels = {
    congruent_zh: '中文 · 一致', incongruent_zh: '中文 · 不一致', congruent_en: '英文 · 一致',
    incongruent_en: '英文 · 不一致', neutral: '情绪 · 中性词', negative: '情绪 · 负性词'
  };
  const effects = {
    seev: [
      ['high_unreported','高优先 · 未正确报告率','百分点',100,1],
      ['high_miss','高优先 · 超时漏报率','百分点',100,1],
      ['high_wrong','高优先 · 错报率','百分点',100,1],
      ['high_rt','高优先 · 正确平均反应时']
    ],
    stroop: [['zh','中文 · 不一致−一致'], ['en','英文 · 不一致−一致'], ['emotion','情绪 · 负性−中性'], ['language','中文干扰−英文干扰']]
  };
  const eyeEffects = [['eye','空窗高优先注视占比 · 相邻−交错','百分点',100,1]];
  function monitorLabel(key) {
    const [layout,priority] = key.split('_');
    return Lab.layoutLabels[layout] + ' · ' + (priority === 'high' ? '高优先' : '普通');
  }
  function table(headers, rows) {
    return `<div class="table-wrap"><table><thead><tr>${headers.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(([label,...cells]) => `<tr><th scope="row">${label}</th>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function person(kind, run) {
    const result = Lab.stats.summarize(kind,run.trials);
    const overall = result.overall;
    const conditions = (kind === 'seev' ? monitorOrder : stroopOrder).map(key => {
      const c = result.cells[key];
      return kind === 'seev' ?
        [monitorLabel(key), c.n, percent(c.unreported), c.misses, c.wrong, ms(c.rt)] :
        [stroopLabels[key], c.n, percent(c.acc), ms(c.rt)];
    });
    const headers = kind === 'seev' ? ['条件','有效异常','未正确报告率','漏报','错报','正确平均反应时'] :
      ['条件','有效试次','正确率','正确平均反应时'];
    const conditionDetails = kind === 'seev' ?
      table(['布局','有效区段','空窗误报'],Object.entries(result.layouts).map(([key,layout]) => [Lab.layoutLabels[key],layout.n,layout.falseAlarms])) :
      '';
    const comparison = kind === 'seev' ? '效应差值 · 相邻减交错' : '效应差值';
    return `<div class="metrics"><div><small>有效正式试次</small><strong>${overall.n} / ${Lab.config.totals[kind]}</strong></div><div><small>正确率</small><strong>${percent(overall.acc)}</strong></div><div><small>正确平均反应时</small><strong>${ms(overall.rt)}</strong></div></div>
      <h2>条件明细</h2>${table(headers,conditions)}${conditionDetails}
      <h2>${comparison}</h2>${table(['对比','个人差值'],effects[kind].map(([key,label,...format]) => [label,delta(result.effects[key], ...format)]))}
      ${kind === 'seev' ? eyePerson(result) : ''}`;
  }
  function eyePerson({ layouts, effects: values }) {
    const figures = Object.entries(layouts).map(([key,d]) => {
      const cells = d.shares.map((share,i) => `<div style="--level:${share == null ? 0 : share}">
        <small>CAM 0${i+1}${d.high.includes(i+1) ? ' · 高优先' : ''}</small><strong>${percent(share)}</strong></div>`).join('');
      return `<figure class="chart"><figcaption>${Lab.layoutLabels[key]} · 高优先 ${percent(d.highShare)}</figcaption>
        <div class="gaze-grid">${cells}</div><p>区内样本 ${d.inWindows} / ${d.samples} 次回调</p></figure>`;
    });
    return `<h2>空窗视线分布</h2><p>小怪不在画面内时，四格显示各窗口占有效区内样本的比例。未达眼动门槛时显示「—」。</p>
      <div class="chart-grid">${figures.join('')}</div>
      ${table(['对比','个人差值'],eyeEffects.map(([key,label,...format]) => [label,delta(values[key], ...format)]))}`;
  }
  function status(run) {
    const labels = { local: '已保存在本机 · 未上传', pending: '上传状态待核验', unknown: '未确认上传', rejected: '服务器拒绝 · 未上传', sent: '已上传' };
    const w = run.upload.warnings;
    const details = run.upload.warning_details;
    const warnings = Array.isArray(w) ? w : w ? [w] : [];
    const hasWarnings = warnings.length || (Array.isArray(details) && details.length);
    const state = run.upload.state;
    const button = run.status === 'complete' ? (
      ['pending','unknown'].includes(state) ? `<button class="secondary small" data-action="verify" data-kind="${run.kind}">核验上传</button>` :
      ['local','rejected'].includes(state) ? `<button class="secondary small" data-action="send" data-kind="${run.kind}">提交${Lab.config.test ? '测试' : ''}记录</button>` : ''
    ) : '';
    return `<div class="receipt" data-receipt="${run.kind}"><div><strong>${Lab.data.storageOK() ? labels[state] : '本机存储不可用，请下载备份'}${hasWarnings ? ' · 有字段警告' : ''}</strong>
      ${run.upload.message ? `<p>${e(run.upload.message)}</p>` : ''}
      ${hasWarnings ? `<details><summary>查看课程接口字段警告</summary><pre>${e(JSON.stringify({ warnings, details }, null, 2))}</pre></details>` : ''}
      <p class="verify-note" aria-live="polite"></p></div>${button}</div>`;
  }
  function dots(people, definitions) {
    const series = definitions.map(([key,label,unit='ms',scale=1,digits=0]) => {
      const values = people.map(p => p.effects[key]).filter(n => n !== null).map(n => n * scale);
      return { label, values, unit, digits };
    });
    const rows = series.map(({label, values, unit, digits}) => {
      const avg = Lab.stats.mean(values);
      const sd = values.length > 1 ? Math.sqrt(values.reduce((sum,n) => sum + (n - avg) ** 2, 0)/(values.length-1)) : null;
      return [label, values.length, delta(avg,unit,1,digits), sd == null ? '—' : fmt(sd,digits) + ' ' + unit];
    });
    const charts = series.filter(s => s.values.length).map(({label,values,unit,digits}) => {
      const range = Math.max(1, ...values.map(Math.abs)) * 1.07;
      const x = n => 180 + 157 * n / range;
      const avg = Lab.stats.mean(values);
      return `<figure class="chart"><figcaption>${label} <small>n=${values.length}</small></figcaption><svg viewBox="0 0 360 62" role="img" aria-label="${label}的个体效应点与组均值">
        <path d="M23 40H337 M180 10V42" stroke="#9c949d" fill="none"/>
        ${values.map((n,i) => `<circle cx="${x(n)}" cy="${19+(i%4)*5}" r="3" fill="#6956ba" opacity=".7"><title>${signed(n,digits)} ${unit}</title></circle>`).join('')}
        <path d="M${x(avg)} 10v30" stroke="#24212a" stroke-width="2"/>
        <g text-anchor="middle" font-size="10" fill="#403949"><text x="32" y="55">${fmt(-range,digits)}</text><text x="180" y="55">0 ${unit}</text><text x="328" y="55">${fmt(range,digits)}</text></g></svg></figure>`;
    }).join('');
    return table(['对比','配对人数','平均差值','标准差'], rows) + (charts ? `<p>圆点代表个人差值，深色竖线代表均值。每图独立缩放。</p><div class="chart-grid">${charts}</div>` : '');
  }
  function group(kind, records) {
    const people = Lab.stats.analyze(kind,records);
    const title = kind === 'seev' ? '城市四屏监控 · SEEV' : '中英情绪 Stroop';
    const count = `<p><strong>${people.length} / 5</strong> 名行为有效被试${people.length >= 5 ? ' · 达到课程人数门槛' : ' · 正在收集'}</p>`;
    const eyeN = people.filter(p => Object.values(p.layouts).some(layout => layout.highShare !== null)).length;
    const pairedN = people.filter(p => p.effects.eye != null).length;
    const eyeCount = kind === 'seev' ? `<p>眼动有效 ${eyeN} 人 · 两布局均有效 ${pairedN} 人</p>` : '';
    if (!people.length) return `<h2>${title}</h2>${count}${eyeCount}<div class="empty">暂无可分析的 V2 正式数据。</div>`;
    return `<h2>${title}</h2>${count}${eyeCount}
      ${kind === 'seev' ? '<p>高优先行为差值按相邻布局减交错布局计算。</p>' : ''}
      ${dots(people,effects[kind])}
      ${kind === 'seev' ? '<h3>空窗高优先注视</h3>' + dots(people,eyeEffects) : ''}`;
  }
  Lab.results = { person, status, group };
})();

