(() => {
  const Lab = window.Patrol;
  // 刺激墨色、常驻图例和判分统一读取这四项。
  const colors = [
    { id: 'red', label: '红', en: 'RED', hex: '#bc273c', key: 'f' },
    { id: 'blue', label: '蓝', en: 'BLUE', hex: '#2459bd', key: 'g' },
    { id: 'green', label: '绿', en: 'GREEN', hex: '#187849', key: 'j' },
    { id: 'purple', label: '紫', en: 'PURPLE', hex: '#822ba0', key: 'k' }
  ];
  const moduleLabels = { zh: '中文色词', en: '英文色词', emotion: '情绪词' };
  const layoutLabels = { diagonal: '交错布局', adjacent: '相邻布局' };
  const monitorKeys = ['1','2','3','4'];
  const monitorNames = ['左上','右上','左下','右下'];
  const orders = [[0,1,2],[1,2,0],[2,0,1],[0,2,1],[1,0,2],[2,1,0]];
  const words = {
    negative: ['恐惧','绝望','痛苦','孤独','烦恼','担心'],
    neutral: ['桌子','报纸','窗户','书架','沙发','杯子']
  };
  function hash(value) {
    return [...value].reduce((n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0, 0);
  }
  function seeded(seed) {
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }
  function shuffle(array, random) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function participantOrder(participant) {
    const serial = /^P(\d{1,8})$/i.exec(participant);
    return serial ? Math.max(0, Number(serial[1]) - 1) : hash(participant);
  }

  function seevBlocks(order) {
    // 8 个编号组合轮换先后、对角线和相邻列，布局内各屏等频。
    const diagonal = Math.floor(order / 2) % 2 ? [2,3] : [1,4];
    const adjacent = Math.floor(order / 4) % 2 ? [2,4] : [1,3];
    const groups = Object.entries({ diagonal, adjacent }).map(([id, high]) => ({ id, name: layoutLabels[id], high, count: 20 }));
    return order % 2 ? groups.reverse() : groups;
  }
  function seevDesign(order, random) {
    return seevBlocks(order).map(block => {
      const { id, high } = block;
      const windows = shuffle(Array.from({ length: 20 }, (_,i) => i % 4 + 1), random);
      const delays = shuffle(Array.from({ length: 20 }, (_,i) => [820,970,1120,1270][i % 4]), random);
      const trials = windows.map((position, i) => {
        const priority = high.includes(position) ? 'high' : 'standard';
        return { layout: id, priority, cond: id + '_' + priority, position, delay: delays[i] };
      });
      return { ...block, trials };
    });
  }
  function stroopCue(module, ink, meaning, word) {
    const color = colors[ink];
    return { ink: color.id, word: word ?? (module === 'en' ? colors[meaning].en : colors[meaning].label) };
  }
  function stroopBlocks(order) {
    const groups = Object.entries(moduleLabels).map(([id, name]) => ({ id, name, count: 10 }));
    return orders[order % orders.length].map(i => groups[i]);
  }
  function stroopDesign(order, random) {
    return stroopBlocks(order).map(block => {
      const module = block.id;
      const m = Object.keys(moduleLabels).indexOf(module);
      const trials = [];
      const conditions = module === 'emotion' ? ['neutral','negative'] : ['congruent','incongruent'];
      conditions.forEach((condition, c) => {
        // 每条件覆盖四种墨色，第五题的墨色跨编号轮换。
        const extra = (order + m + 2 * c) % 4;
        const inks = [0,1,2,3,extra];
        inks.forEach((ink,i) => {
          const shift = 1 + (Math.floor(order / 4) + Number(i === 4)) % 3;
          const meaning = condition === 'incongruent' ? (ink + shift) % 4 : ink;
          const word = module === 'emotion' ? words[condition][(order + i) % words[condition].length] : undefined;
          trials.push({
            ...stroopCue(module, ink, meaning, word), module,
            cond: module === 'emotion' ? condition : condition + '_' + module,
            meaning: module === 'emotion' ? null : colors[meaning].id
          });
        });
      });
      return { ...block, trials: shuffle(trials, random) };
    });
  }
  // 练习只生成当前画面所需的临时提示材料，不接触正式试次字段或存储。
  const practiceStroop = module => colors.map((_,i) => stroopCue(module, i, (i+1)%4,
    module === 'emotion' ? ['邮票','平静','钥匙','紧张'][i] : undefined));
  Lab.design = (kind, participant, runId) => {
    const order = participantOrder(participant);
    const random = seeded(hash(runId + kind));
    return kind === 'seev' ? seevDesign(order, random) : stroopDesign(order, random);
  };
  Lab.blocks = (kind, participant) => (kind === 'seev' ? seevBlocks : stroopBlocks)(participantOrder(participant));
  Object.assign(Lab, { colors, moduleLabels, layoutLabels, monitorKeys, monitorNames, practiceStroop });
})();
