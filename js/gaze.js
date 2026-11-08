(() => {
  const Lab = window.Patrol;
  let observer = null;
  let active = false;
  let pending = false;
  let generation = 0;
  let library;

  function stop() {
    generation++;
    active = false;
    observer = null;
    const wg = window.webgazer;
    if (!wg) return;
    const container = document.getElementById(wg.params.videoContainerId);
    const video = document.getElementById(wg.params.videoElementId);
    const dot = document.getElementById(wg.params.gazeDotId);
    video?.srcObject?.getTracks().forEach(track => track.stop());
    wg.pause().removeMouseEventListeners().clearGazeListener();
    if (container && dot) wg.end();
    else container?.remove();
  }
  async function start() {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia ||
        (location.protocol !== 'https:' && location.hostname !== 'localhost')) {
      throw Error('眼动需用 HTTPS 或 localhost 打开。可以继续按键版。');
    }
    if (pending) throw Error('请先完成浏览器的摄像头权限提示。');
    stop();
    const attempt = generation;
    library ??= new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = './vendor/webgazer/webgazer.js';
      script.onload = resolve;
      script.onerror = () => { library = null; reject(Error('眼动组件加载失败。')); };
      document.head.append(script);
    });
    await library;
    if (attempt !== generation) throw Error('本次摄像头开启已取消。');
    const wg = window.webgazer;
    wg.params.faceMeshSolutionPath = new URL('./vendor/webgazer/mediapipe/face_mesh', document.baseURI).href;
    wg.params.camConstraints = { video: { width: { ideal: 640 }, height: { ideal: 480 } }, audio: false };
    wg.saveDataAcrossSessions(false).showVideoPreview(false).showPredictionPoints(false);
    // 只重置内存模型，避免清空同源站点的 LocalForage 存储。
    wg.getRegression().forEach(model => model.init());
    wg.setGazeListener(data => observer?.(data, performance.now()));
    pending = true;
    let timer;
    try {
      const launch = wg.begin(() => {}).then(() => {
        if (attempt !== generation) {
          stop();
          throw Error('本次摄像头开启已取消。');
        }
        if (!wg.isReady()) throw Error('摄像头未就绪。');
        wg.removeMouseEventListeners();
        active = true;
      }).finally(() => { pending = false; });
      await Promise.race([launch, new Promise((_, reject) => {
        timer = setTimeout(() => reject(Error('摄像头或模型未能及时启动。')), 35000);
      })]);
    } catch (error) {
      stop();
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  // 只取四块实际画面内的坐标。边框、间距和画面外都不属于监控区域。
  function region(point, rects) {
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return -1;
    return rects.findIndex(rect => point.x >= rect.left && point.x < rect.right &&
      point.y >= rect.top && point.y < rect.bottom);
  }

  // 正式无怪时只累计回调总量与四屏命中次数，原始坐标立即丢弃。
  function monitor(rects, isEmpty) {
    let total = 0;
    const hits = [0,0,0,0];
    observer = point => {
      if (!isEmpty()) return;
      total++;
      const q = region(point, rects);
      if (q >= 0) hits[q]++;
    };
    return () => {
      observer = null;
      return { gaze_samples: total, gaze_cam1: hits[0], gaze_cam2: hits[1], gaze_cam3: hits[2], gaze_cam4: hits[3] };
    };
  }
  addEventListener('pagehide', stop);
  Lab.gaze = {
    start, stop, monitor, region, active: () => active,
    listen: fn => { observer = fn; },
    train: (x, y) => window.webgazer.recordScreenPosition(x, y)
  };
})();

