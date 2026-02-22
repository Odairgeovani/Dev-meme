/**
 * Meme por Gestos - usa webcam, cara séria e mão na boca para mostrar imagens.
 * MediaPipe Face Landmarker (blendshapes) + Hand Landmarker.
 */

const video = document.getElementById('webcam');
const overlay = document.getElementById('overlay');
const memeDisplay = document.getElementById('meme-display');
const memeImage = document.getElementById('meme-image');
const memeLabel = document.getElementById('meme-label');
const statusEl = document.getElementById('status');
const btnStart = document.getElementById('btn-start');
const inputMemeSeria = document.getElementById('meme-seria');
const inputMemeMao = document.getElementById('meme-mao');

let faceLandmarker = null;
let handLandmarker = null;
let lastVideoTime = -1;
let animationId = null;
let stream = null;
let memeSeriaUrl = 'img/serio.jpeg';
let memeMaoUrl = 'img/mao-na-boca.jpeg';

// Índices da boca no Face Landmarker (478 landmarks)
const MOUTH_LEFT = 61;
const MOUTH_RIGHT = 291;
const MOUTH_CENTER_TOP = 13;
const MOUTH_CENTER_BOTTOM = 14;

const SMILE_THRESHOLD = 0.25;
const HAND_NEAR_MOUTH_DIST = 0.22;
const BROW_DOWN_THRESHOLD = 0.3;
const MOUTH_FROWN_THRESHOLD = 0.3;

let showingMode = null;

function setStatus(msg, className = '') {
  statusEl.textContent = msg;
  statusEl.className = 'status ' + className;
}

function showMeme(url, label) {
  if (!url) return;
  memeImage.src = url;
  memeLabel.textContent = label;
  memeDisplay.classList.remove('hidden');
}

function hideMeme() {
  memeDisplay.classList.add('hidden');
  memeImage.src = '';
}

function getMouthCenter(landmarks) {
  if (!landmarks || landmarks.length < 300) return null;
  const l = landmarks[MOUTH_LEFT];
  const r = landmarks[MOUTH_RIGHT];
  if (!l || !r) return null;
  return { x: (l.x + r.x) / 2, y: (l.y + r.y) / 2 };
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getBlendshapeScore(blendshapes, name) {
  const found = blendshapes.find(b => b.categoryName === name);
  return found ? found.score : 0;
}

function isHandNearMouth(handLandmarks, mouthCenter) {
  if (!mouthCenter || !handLandmarks || handLandmarks.length === 0) return false;
  for (const hand of handLandmarks) {
    for (const pt of hand) {
      if (distance({ x: pt.x, y: pt.y }, mouthCenter) < HAND_NEAR_MOUTH_DIST)
        return true;
    }
  }
  return false;
}

function detectLoop() {
  if (!video.srcObject || video.readyState < 2 || !faceLandmarker || !handLandmarker) {
    animationId = requestAnimationFrame(detectLoop);
    return;
  }

  const now = video.currentTime;
  if (now !== lastVideoTime && now > 0) {
    lastVideoTime = now;
    let faceResult, handResult;
    try {
      faceResult = faceLandmarker.detectForVideo(video, performance.now());
      handResult = handLandmarker.detectForVideo(video, performance.now());
    } catch (e) {
      animationId = requestAnimationFrame(detectLoop);
      return;
    }

    let serious = false;
    let handNearMouth = false;

    if (faceResult.faceLandmarks && faceResult.faceLandmarks.length > 0) {
      const landmarks = faceResult.faceLandmarks[0];
      const mouthCenter = getMouthCenter(landmarks);

      let blendshapes = null;
      if (faceResult.faceBlendshapes && faceResult.faceBlendshapes.length > 0) {
        const bs = faceResult.faceBlendshapes[0];
        if (bs && Array.isArray(bs.categories)) blendshapes = bs.categories;
      }

      if (blendshapes) {
        const mouthSmile = getBlendshapeScore(blendshapes, 'mouthSmile');
        const browDown =
          (getBlendshapeScore(blendshapes, 'browDownLeft') +
            getBlendshapeScore(blendshapes, 'browDownRight')) /
          2;
        const mouthFrown =
          (getBlendshapeScore(blendshapes, 'mouthFrownLeft') +
            getBlendshapeScore(blendshapes, 'mouthFrownRight')) /
          2;

        if (
          mouthSmile < SMILE_THRESHOLD &&
          (browDown > BROW_DOWN_THRESHOLD || mouthFrown > MOUTH_FROWN_THRESHOLD)
        )
          serious = true;
      } else if (landmarks[MOUTH_CENTER_TOP] && landmarks[MOUTH_LEFT]) {
        const cornerY = (landmarks[MOUTH_LEFT].y + landmarks[MOUTH_RIGHT].y) / 2;
        const topY = landmarks[MOUTH_CENTER_TOP].y;
        if (cornerY >= topY - 0.02) serious = true;
      }

      if (mouthCenter && handResult.landmarks && handResult.landmarks.length > 0)
        handNearMouth = isHandNearMouth(handResult.landmarks, mouthCenter);
    }

    if (handNearMouth && memeMaoUrl) {
      showingMode = 'mao';
      showMeme(memeMaoUrl, 'Mão na boca');
    } else if (serious && memeSeriaUrl) {
      showingMode = 'seria';
      showMeme(memeSeriaUrl, 'Cara séria');
    } else {
      showingMode = null;
      hideMeme();
    }
  }

  animationId = requestAnimationFrame(detectLoop);
}

async function initModels() {
  setStatus('Carregando modelos MediaPipe...');
  const Vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.mjs');
  const vision = await Vision.FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );

  const faceModel = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
  const handModel = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

  faceLandmarker = await Vision.FaceLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: faceModel },
    runningMode: 'VIDEO',
    numFaces: 1,
    outputFaceBlendshapes: true
  });

  handLandmarker = await Vision.HandLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: handModel },
    runningMode: 'VIDEO',
    numHands: 2
  });

  setStatus('Modelos prontos. Inicie a câmera.');
  return true;
}

async function startCamera() {
  try {
    setStatus('Acessando câmera...');
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: 640, height: 480 }
    });
    video.srcObject = stream;
    await video.play();
    setStatus('Detectando gestos...', 'detecting');
    btnStart.disabled = true;

    if (!faceLandmarker || !handLandmarker) await initModels();

    lastVideoTime = -1;
    detectLoop();
  } catch (e) {
    setStatus('Erro na câmera: ' + e.message, 'error');
    btnStart.disabled = false;
  }
}

inputMemeSeria.addEventListener('change', function () {
  const f = this.files[0];
  if (f) memeSeriaUrl = URL.createObjectURL(f);
});

inputMemeMao.addEventListener('change', function () {
  const f = this.files[0];
  if (f) memeMaoUrl = URL.createObjectURL(f);
});

btnStart.addEventListener('click', startCamera);

// Inicialização: carregar modelos em background
setStatus('Clique em Iniciar câmera ou escolha outras imagens acima.');
initModels().then(() => setStatus('Pronto. Use as imagens padrão ou troque-as acima.')).catch(() => {});
