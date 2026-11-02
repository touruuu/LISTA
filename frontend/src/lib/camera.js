function stopCamera(stream, video) {
  try {
    for (const track of stream?.getTracks?.() || []) {
      try { track.stop(); } catch { /* stop remaining tracks */ }
    }
  } finally {
    if (video) {
      try { video.pause?.(); } catch { /* detached video */ }
      try { video.srcObject = null; } catch { /* detached video */ }
    }
  }
}

function waitForVideo(video, ready, events, timeoutMs, timeoutMessage) {
  if (ready()) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let timer;
    const cleanup = () => {
      clearTimeout(timer);
      for (const [name, handler] of handlers) video.removeEventListener?.(name, handler);
    };
    const finish = (error) => {
      cleanup();
      if (error) reject(error);
      else resolve();
    };
    const handlers = events.map((name) => [name, () => {
      if (name === 'error') finish(new Error('Camera video failed to load.'));
      else if (ready()) finish();
    }]);
    for (const [name, handler] of handlers) video.addEventListener?.(name, handler);
    timer = setTimeout(() => finish(new Error(timeoutMessage)), timeoutMs);
  });
}

async function waitForUsableFrame(video, timeoutMs) {
  await waitForVideo(
    video,
    () => video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0,
    ['loadeddata', 'canplay', 'error'],
    timeoutMs,
    'Camera frame timed out.',
  );
}

async function waitForMetadata(video, timeoutMs) {
  await waitForVideo(
    video,
    () => video.readyState >= 1,
    ['loadedmetadata', 'error'],
    timeoutMs,
    'Camera metadata timed out.',
  );
}

async function openCamera({ video, mediaDevices = globalThis.navigator?.mediaDevices, timeoutMs = 5000 } = {}) {
  if (!video) throw new TypeError('A video element is required.');
  if (typeof mediaDevices?.getUserMedia !== 'function') throw new Error('Camera capture is unavailable in this browser.');
  const stream = await mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 1280 } },
    audio: false,
  });
  try {
    video.muted = true;
    video.playsInline = true;
    video.setAttribute?.('playsinline', '');
    video.setAttribute?.('muted', '');
    video.srcObject = stream;
    await waitForMetadata(video, timeoutMs);
    await video.play();
    await waitForUsableFrame(video, timeoutMs);
    return stream;
  } catch (error) {
    stopCamera(stream, video);
    throw error;
  }
}

function captureFrame(video, canvas, { width = 900, height = 440 } = {}) {
  if (!video?.videoWidth || !video?.videoHeight) throw new Error('No camera frame is available.');
  if (!canvas || typeof canvas.getContext !== 'function') throw new TypeError('A canvas is required.');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Camera frame could not be encoded.');
  canvas.width = width;
  canvas.height = height;
  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;
  const targetRatio = width / height;
  const sourceRatio = sourceWidth / sourceHeight;
  let sx = 0;
  let sy = 0;
  let sw = sourceWidth;
  let sh = sourceHeight;
  if (sourceRatio > targetRatio) {
    sw = sourceHeight * targetRatio;
    sx = (sourceWidth - sw) / 2;
  } else if (sourceRatio < targetRatio) {
    sh = sourceWidth / targetRatio;
    sy = (sourceHeight - sh) / 2;
  }
  context.drawImage(video, sx, sy, sw, sh, 0, 0, width, height);
  return canvas;
}

export { captureFrame, openCamera, stopCamera };
