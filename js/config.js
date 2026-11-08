(() => {
  const Lab = window.Patrol = {};
  Lab.config = Object.freeze({
    server: 'https://attention-lab-production.up.railway.app',
    projects: { seev: 'ELX893', stroop: 'EVE2EL' },
    experiments: { seev: 'seev_city_monitor', stroop: 'stroop_v2' },
    version: 'patrol-2.0.0',
    test: new URLSearchParams(location.search).get('test') === '1',
    totals: { seev: 40, stroop: 30 },
    cells: {
      seev: { diagonal_high: 10, diagonal_standard: 10, adjacent_high: 10, adjacent_standard: 10 },
      stroop: { congruent_zh: 5, incongruent_zh: 5, congruent_en: 5, incongruent_en: 5, neutral: 5, negative: 5 }
    },
    monitor: { segment: 2800, visible: 1400, practiceSegment: 2100 }
  });
  Lab.escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
})();
