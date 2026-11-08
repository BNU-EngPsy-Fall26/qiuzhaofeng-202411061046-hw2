(() => {
  const Lab = window.Patrol;
  const { gaze, config } = Lab;

  // 两项实验共用前台、长帧、重复按键和 Esc 的处理，时钟保持单调。
  function runFrames(keys, frameStep, press) {
    return new Promise(resolve => {
      let frame;
      let lastFrame;
      function finish(reason = '') {
        cancelAnimationFrame(frame);
        document.removeEventListener('keydown', keydown);
        document.removeEventListener('visibilitychange', visibility);
        window.removeEventListener('blur', blur);
        window.removeEventListener('resize', resize);
        resolve(reason);
      }
      function keydown(event) {
        if (event.repeat) return;
        const key = event.key.toLowerCase();
        if (key === 'escape') {
          event.preventDefault();
          return finish('exit');
        }
        if (!keys.includes(key) || event.ctrlKey || event.altKey || event.metaKey ||
            event.target.closest?.('button, input, select')) return;
        event.preventDefault();
        const at = performance.now();
        if (document.hidden) return finish('hidden');
        if (lastFrame != null && at - lastFrame > 150) return finish('frame_gap');
        if (press(key, at)) finish();
      }
      function tick() {
        const at = performance.now();
        if (document.hidden) return finish('hidden');
        if (lastFrame != null && at - lastFrame > 150) return finish('frame_gap');
        lastFrame = at;
        if (frameStep(at)) return finish();
        frame = requestAnimationFrame(tick);
      }
      const visibility = () => { if (document.hidden) finish('hidden'); };
      const blur = () => finish('blur');
      const resize = () => finish('resize');
      document.addEventListener('keydown', keydown);
      document.addEventListener('visibilitychange', visibility);
      window.addEventListener('blur', blur);
      window.addEventListener('resize', resize);
      frame = requestAnimationFrame(tick);
    });
  }

  // 判分和常驻图例读取同一配置。练习只返回即时反馈，正式入口才构造记录。
  async function showWord(arena, cue, timed) {
    const color = Lab.colors.find(c => c.id === cue.ink);
    const keys = Lab.colors.map(c => c.key);
    let fixationAt;
    let shownAt;
    let response = null;
    let rt = null;
    let outcome = 'timeout';
    arena.innerHTML = '<span class="fixation">+</span>';
    const paused = await runFrames(keys, at => {
      fixationAt ??= at;
      if (shownAt == null && at - fixationAt >= 420) {
        arena.innerHTML = `<span class="ink" style="color:${color.hex}">${Lab.escape(cue.word)}</span>`;
        shownAt = performance.now();
      }
      return shownAt != null && at - shownAt >= 3000;
    }, (key, at) => {
      if (shownAt == null) return false;
      if (at - shownAt >= 3000) return true;
      response = key;
      if (timed) rt = Math.round(at - shownAt);
      outcome = at - shownAt < 150 ? 'too_fast' : 'response';
      return true;
    });
    arena.replaceChildren();
    const correct = outcome === 'response' && response === color.key;
    if (!timed) return { paused, feedback: correct ? '正确' : '请按 ' + color.key.toUpperCase() };
    return {
      paused,
      row: shownAt != null ? {
        ...cue, expected: color.key, response, rt, reason: paused || outcome,
        valid: Number(!paused && outcome !== 'too_fast'), correct: Number(!paused && correct)
      } : null
    };
  }

  // 一段连续 RAF 按预设区段时钟呈现异常。按键不会提前移除小怪。
  async function monitor(arena, schedule, { segmentMs, onEvent, onFeedback }) {
    const pictures = [...arena.querySelectorAll('.cam-picture')];
    const ghosts = pictures.map(picture => picture.querySelector('.cam-ghost'));
    const rects = pictures.map(picture => picture.getBoundingClientRect());
    let origin;
    let index = 0;
    let shownAt;
    let response;
    let rt;
    let alarms = 0;
    let showing = false;
    let finishEyes;
    const formal = Boolean(onEvent);
    const eyeMode = formal && gaze.active() ? 'webgazer' : 'keyboard';
    function beginSegment() {
      shownAt = null;
      response = null;
      rt = null;
      alarms = 0;
      // 校准后的设备可保持就绪，仅正式时段订阅眼动回调。
      finishEyes = eyeMode === 'webgazer' ? gaze.monitor(rects, () => !showing) : null;
    }
    function hide() {
      if (!showing) return;
      showing = false;
      ghosts[schedule[index].position - 1].hidden = true;
      if (onFeedback) {
        const expected = String(schedule[index].position);
        onFeedback(response === expected ? '正确' : '请报告 CAM 0' + expected);
      }
    }
    function endSegment(paused = '') {
      hide();
      const eyes = finishEyes?.();
      if (!formal || shownAt == null) return;
      const event = schedule[index];
      const expected = String(event.position);
      const outcome = paused ? 'interrupted' : response == null ? 'miss' : response === expected ? 'correct' : 'wrong';
      onEvent({
        ...event, expected, response, rt, false_alarms: alarms,
        valid: Number(!paused), correct: Number(outcome === 'correct'),
        reason: paused || outcome, outcome, eye_mode: eyeMode,
        ...(eyes && !paused ? eyes : {})
      });
    }
    const pause = await runFrames(Lab.monitorKeys, at => {
      if (origin == null) { origin = at; beginSegment(); }
      const elapsed = at - origin;
      if (elapsed >= (index + 1) * segmentMs) {
        endSegment();
        index++;
        if (index === schedule.length) return true;
        beginSegment();
      }
      if (shownAt == null && elapsed >= index * segmentMs + schedule[index].delay) {
        onFeedback?.('');
        ghosts[schedule[index].position - 1].hidden = false;
        showing = true;
        shownAt = performance.now();
      }
      if (showing && at - shownAt >= config.monitor.visible) hide();
      return false;
    }, (key, at) => {
      if (origin == null) return false;
      if (showing) {
        if (at - shownAt < config.monitor.visible && response == null) {
          response = key;
          if (formal) rt = Math.round(at - shownAt);
        }
      } else if (formal) alarms++;
      else onFeedback('请等异常出现再按键');
      return false;
    });
    if (pause && origin != null) endSegment(pause);
    return pause;
  }

  function practiceMonitor(arena, feedback) {
    const cues = [1,4,2,3,1].map(position => ({ position, delay: 460 }));
    return monitor(arena, cues, { segmentMs: config.monitor.practiceSegment, onFeedback: feedback });
  }
  function formalMonitor(arena, schedule, record) {
    return monitor(arena, schedule, { segmentMs: config.monitor.segment, onEvent: record });
  }
  Lab.runner = {
    practiceWord: (arena, cue) => showWord(arena, cue, false),
    formalWord: (arena, cue) => showWord(arena, cue, true),
    practiceMonitor, formalMonitor
  };
})();
