import test from 'node:test';
import assert from 'node:assert/strict';

const cameraModule = import('../src/lib/camera.js').catch(() => null);

function fakeVideo({ readyState = 2, videoWidth = 640, videoHeight = 480, play = async () => {} } = {}) {
  return {
    readyState, videoWidth, videoHeight, srcObject: null,
    muted: false, playsInline: false, play,
    handlers: {},
    addEventListener(name, fn) { this.handlers[name] = fn; },
    removeEventListener(name) { delete this.handlers[name]; },
  };
}

function fakeStream() {
  const tracks = [{ stopped: false, stop() { this.stopped = true; } }, { stopped: false, stop() { this.stopped = true; } }];
  return { tracks, getTracks: () => tracks };
}

async function loadCamera() {
  const mod = await cameraModule;
  assert.equal(typeof mod?.openCamera, 'function', 'camera.js must export openCamera');
  assert.equal(typeof mod?.stopCamera, 'function', 'camera.js must export stopCamera');
  assert.equal(typeof mod?.captureFrame, 'function', 'camera.js must export captureFrame');
  return mod;
}

test('camera module exports lifecycle and frame-capture helpers', async () => {
  const mod = await cameraModule;
  assert.equal(typeof mod?.openCamera, 'function', 'camera.js must export openCamera');
  assert.equal(typeof mod?.stopCamera, 'function', 'camera.js must export stopCamera');
  assert.equal(typeof mod?.captureFrame, 'function', 'camera.js must export captureFrame');
});

test('opens the rear camera as a muted inline preview and returns its live stream', async () => {
  const { openCamera } = await loadCamera();
  const video = fakeVideo();
  const stream = fakeStream();
  let requested;
  const result = await openCamera({
    video,
    mediaDevices: { getUserMedia: async (constraints) => { requested = constraints; return stream; } },
    timeoutMs: 20,
  });
  assert.equal(result, stream);
  assert.equal(video.srcObject, stream);
  assert.equal(video.muted, true);
  assert.equal(video.playsInline, true);
  assert.deepEqual(requested, {
    video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 1280 } },
    audio: false,
  });
  assert.equal(stream.tracks.every((track) => !track.stopped), true);
});

test('permission denial is surfaced and never leaves a camera stream attached', async () => {
  const { openCamera } = await loadCamera();
  const video = fakeVideo();
  await assert.rejects(openCamera({
    video,
    mediaDevices: { getUserMedia: async () => { throw new Error('Permission denied'); } },
    timeoutMs: 20,
  }), /Permission denied/);
  assert.equal(video.srcObject, null);
});

test('unsupported browsers receive a clear camera-unavailable error', async () => {
  const { openCamera } = await loadCamera();
  const video = fakeVideo();
  await assert.rejects(openCamera({ video, mediaDevices: {} }), /Camera capture is unavailable/);
  assert.equal(video.srcObject, null);
});

test('a stream is stopped and detached when no usable video frame arrives', async () => {
  const { openCamera } = await loadCamera();
  const video = fakeVideo({ readyState: 1, videoWidth: 0, videoHeight: 0 });
  const stream = fakeStream();
  await assert.rejects(openCamera({
    video,
    mediaDevices: { getUserMedia: async () => stream },
    timeoutMs: 5,
  }), /frame|timeout/i);
  assert.equal(stream.tracks.every((track) => track.stopped), true);
  assert.equal(video.srcObject, null);
});

test('stopCamera stops every track and clears the video source', async () => {
  const { stopCamera } = await loadCamera();
  const video = fakeVideo();
  const stream = fakeStream();
  video.srcObject = stream;
  stopCamera(stream, video);
  assert.equal(stream.tracks.every((track) => track.stopped), true);
  assert.equal(video.srcObject, null);
});

test('captureFrame center-crops camera video instead of stretching its aspect ratio', async () => {
  const { captureFrame } = await loadCamera();
  const video = fakeVideo({ videoWidth: 640, videoHeight: 480 });
  const calls = [];
  const canvas = { width: 0, height: 0, getContext: () => ({ drawImage: (...args) => calls.push(args) }) };
  const result = captureFrame(video, canvas, { width: 900, height: 440 });
  assert.equal(result, canvas);
  assert.equal(canvas.width, 900);
  assert.equal(canvas.height, 440);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], video);
  assert.equal(calls[0].length, 9, 'uses source crop plus destination bounds');
  assert.ok(calls[0][2] > 0 && calls[0][4] < video.videoHeight, 'source crop is valid and centered');
  assert.equal(calls[0][5], 0);
  assert.equal(calls[0][6], 0);
  assert.equal(calls[0][7], 900);
  assert.equal(calls[0][8], 440);
});

test('captureFrame rejects an empty or unavailable camera frame', async () => {
  const { captureFrame } = await loadCamera();
  const video = fakeVideo({ videoWidth: 0, videoHeight: 0 });
  const canvas = { getContext: () => ({ drawImage() {} }) };
  assert.throws(() => captureFrame(video, canvas), /frame|camera/i);
});
