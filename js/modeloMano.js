const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const instructions = document.getElementById('instructions');
let firstDetection = true;
let lastPosition = { x: 0, y: 0, z: 0 };

// Ajustar dimensiones del canvas al iniciar
function adjustCanvasSize() {
  const scaleFactor = 3; // Factor para aumentar resolución (ajusta según calidad deseada)
  const width = window.innerWidth * scaleFactor;
  const height = window.innerHeight * scaleFactor;

  // Dimensiones internas del canvas (resolución alta para calidad)
  canvasElement.width = width;
  canvasElement.height = height;

  // Dimensiones visuales (para que encaje en la pantalla)
  canvasElement.style.width = `${window.innerWidth}px`;
  canvasElement.style.height = `${window.innerHeight}px`;
}

// Ejecutar al cargar y al redimensionar
adjustCanvasSize();
window.addEventListener('resize', adjustCanvasSize);


function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    for (const landmarks of results.multiHandLandmarks) {
      window.drawConnectors(canvasCtx, landmarks, window.HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 5});
      window.drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 2});
    }

    if (firstDetection) {
      instructions.style.display = 'none';
      firstDetection = false;
    }

    const handModel = document.getElementById('hand-model');
    const landmarks = results.multiHandLandmarks[0];
    const handedness = results.multiHandedness[0].label; // 'Left' o 'Right'

    // Mostrar la mano detectada en el canvas (invertida para reflejar la cámara)
    canvasCtx.font = '30px Arial';
    canvasCtx.fillStyle = 'white';
    canvasCtx.fillText(handedness === 'Left' ? 'Renvar' : 'L', 10, 50);

    // Detectar gestos para visibilidad
    const isOpenPalm = landmarks[8].y < landmarks[6].y && 
                       landmarks[12].y < landmarks[10].y && 
                       landmarks[16].y < landmarks[14].y && 
                       landmarks[20].y < landmarks[18].y;

    const isClosedFist = landmarks[8].y > landmarks[6].y && 
                         landmarks[12].y > landmarks[10].y;

    // Controlar visibilidad
    if (isOpenPalm) {
      handModel.setAttribute('visible', true);
    } else if (isClosedFist) {
      handModel.setAttribute('visible', false);
    }

    // Calcular escala dinámica
    const distance = Math.sqrt(
      Math.pow(landmarks[0].x - landmarks[9].x, 2) +
      Math.pow(landmarks[0].y - landmarks[9].y, 2)
    );
    const scale = distance * 2;

    // Cambio: Ajustar el efecto espejo con rotación en lugar de escala negativa
    const baseYaw = handedness === 'Right' ? 180 : 0; // Rotación base para simetría
    handModel.querySelector('a-gltf-model').setAttribute('rotation', `0 ${baseYaw} 0`);
    handModel.setAttribute('scale', `${scale} ${scale} ${scale}`); // Escala normal sin inversión

    // Cambio: Anclar el modelo al punto de muñeca (landmarks[0])
    const anchorPoint = landmarks[0]; // muñeca
    const targetX = (anchorPoint.x - 0.5) * 3; // Mapear X al espacio 3D
    const targetY = (0.5 - anchorPoint.y) * 2; // Mapear Y al espacio 3D
    const targetZ = -1 * (anchorPoint.z + 0.5); // Mapear Z al espacio 3D

    const smoothingFactor = 0.3; // Suavizado para movimientos más naturales
    lastPosition.x += (targetX - lastPosition.x) * smoothingFactor;
    lastPosition.y += (targetY - lastPosition.y) * smoothingFactor;
    lastPosition.z += (targetZ - lastPosition.z) * smoothingFactor;
    handModel.setAttribute('position', `${lastPosition.x} ${lastPosition.y} ${lastPosition.z}`);

    // Cambio: Rotación automática basada en la orientación de la mano
    const dx = landmarks[9].x - landmarks[0].x; // Base del índice a muñeca
    const dy = landmarks[9].y - landmarks[0].y;
    const dz = landmarks[9].z - landmarks[0].z;
    const yaw = -Math.atan2(dy, dx) * (180 / Math.PI);
    const pitch = -Math.atan2(dz, Math.sqrt(dx * dx + dy * dy)) * (180 / Math.PI);
    const currentRotation = handModel.getAttribute('rotation') || { x: 0, y: 0, z: 0 };
    const newYaw = currentRotation.y + (yaw - currentRotation.y) * smoothingFactor;
    const newPitch = currentRotation.x + (pitch - currentRotation.x) * smoothingFactor;
    handModel.setAttribute('rotation', `${newPitch} ${newYaw} 0`);
  } else {
    const handModel = document.getElementById('hand-model');
    handModel.setAttribute('visible', false);
  }
  canvasCtx.restore();
}

const hands = new Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 0,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
hands.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({image: videoElement});
  },
  width: 640,
  height: 480,
  facingMode: 'environment'
});

camera.start().catch(() => {
  camera.setOptions({ facingMode: 'user' });
  camera.start();
});

if (window.DeviceOrientationEvent) {
  window.addEventListener("deviceorientation", (event) => {
    const alpha = event.alpha || 0; // Rotación en el eje Z
    const beta = event.beta || 0; // Inclinación adelante/atrás (X)
    const gamma = event.gamma || 0; // Inclinación izquierda/derecha (Y)
    const camera = document.querySelector('a-camera');
    camera.setAttribute('rotation', `${beta} ${alpha} ${-gamma}`);
  });
}
window.drawConnectors = window.drawConnectors || drawingUtils.drawConnectors;
window.drawLandmarks = window.drawLandmarks || drawingUtils.drawLandmarks;
window.HAND_CONNECTIONS = window.HAND_CONNECTIONS || hands.HAND_CONNECTIONS;