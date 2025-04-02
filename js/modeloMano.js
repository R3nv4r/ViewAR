const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const instructions = document.getElementById('instructions');
let firstDetection = true;
let lastPosition = { x: 0, y: 0, z: 0 };
let lastRotation = { x: 0, y: 0, z: 0 };
let handVisibility = false;
let handVisibilityTimestamp = 0;

// Ajustar dimensiones del canvas al iniciar
function adjustCanvasSize() {
  // Detectar la densidad de píxeles del dispositivo para mejor calidad
  const pixelRatio = window.devicePixelRatio || 1;
  const scaleFactor = Math.min(3, pixelRatio * 1.5); // Limitar para rendimiento
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

// Función de suavizado más avanzada
function smoothValue(current, target, factor = 0.2, deltaTime = 16) {
  // Ajuste dinámico basado en tiempo
  const adjustedFactor = 1 - Math.pow(1 - factor, deltaTime / 16);
  return current + (target - current) * adjustedFactor;
}

let lastFrameTime = 0;

function onResults(results) {
  const now = performance.now();
  const deltaTime = now - lastFrameTime;
  lastFrameTime = now;

  // Dibujar imagen de video
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
  
  const handModel = document.getElementById('hand-model');
  
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];
    const handedness = results.multiHandedness[0].label; // 'Left' o 'Right'
    
    // Dibujar puntos de referencia y conexiones
    window.drawConnectors(canvasCtx, landmarks, window.HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 5});
    window.drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 2});

    // Ocultar instrucciones después de primera detección
    if (firstDetection) {
      instructions.style.display = 'none';
      firstDetection = false;
    }

    // Hacer el modelo visible cuando se detecta la mano
    handModel.setAttribute('visible', true);
    handVisibilityTimestamp = now;

    // Calcular escala dinámica basada en el tamaño de la mano
    const palmSize = Math.sqrt(
      Math.pow(landmarks[0].x - landmarks[9].x, 2) +
      Math.pow(landmarks[0].y - landmarks[9].y, 2) +
      Math.pow(landmarks[0].z - landmarks[9].z, 2)
    );
    const scale = palmSize * 2;

    // Posicionamiento del modelo
    const anchorPoint = landmarks[0]; // muñeca como punto de anclaje
    const targetX = (anchorPoint.x - 0.5) * 3;
    const targetY = (0.5 - anchorPoint.y) * 2;
    const targetZ = -1 * (anchorPoint.z + 0.5);

    // Suavizado dependiente del tiempo
    lastPosition.x = smoothValue(lastPosition.x, targetX, 0.3, deltaTime);
    lastPosition.y = smoothValue(lastPosition.y, targetY, 0.3, deltaTime);
    lastPosition.z = smoothValue(lastPosition.z, targetZ, 0.3, deltaTime);
    
    handModel.setAttribute('position', `${lastPosition.x} ${lastPosition.y} ${lastPosition.z}`);

    // Rotación basada en la orientación de la mano
    const handModel3D = handModel.querySelector('a-gltf-model');
    const baseYaw = handedness === 'Right' ? 180 : 0; // Rotación base para simetría
    
    // Calcular ángulos de orientación de la mano
    const indexBase = landmarks[5]; // Base del dedo índice
    const pinkyBase = landmarks[17]; // Base del dedo meñique
    
    // Vector de orientación de la palma (de meñique a índice)
    const dx = indexBase.x - pinkyBase.x;
    const dy = indexBase.y - pinkyBase.y;
    const dz = indexBase.z - pinkyBase.z;
    
    // Calcular ángulos
    const yaw = -Math.atan2(dy, dx) * (180 / Math.PI) + baseYaw;
    const pitch = -Math.atan2(dz, Math.sqrt(dx * dx + dy * dy)) * (180 / Math.PI);
    const roll = Math.atan2(landmarks[17].y - landmarks[5].y, landmarks[17].x - landmarks[5].x) * (180 / Math.PI);
    
    // Suavizar rotación
    lastRotation.x = smoothValue(lastRotation.x, pitch, 0.2, deltaTime);
    lastRotation.y = smoothValue(lastRotation.y, yaw, 0.2, deltaTime);
    lastRotation.z = smoothValue(lastRotation.z, roll, 0.1, deltaTime);
    
    handModel3D.setAttribute('rotation', `${lastRotation.x} ${lastRotation.y} ${lastRotation.z}`);
    handModel.setAttribute('scale', `${scale} ${scale} ${scale}`);
    
  } else {
    // Mano no detectada
    handModel.setAttribute('visible', false);
  }
  
  canvasCtx.restore();
}

const hands = new Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1, // Aumentado para mejor precisión
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
hands.onResults(onResults);

// Iniciar cámara con mejor calidad si es posible
const cameraOptions = {
  onFrame: async () => {
    await hands.send({image: videoElement});
  },
  width: 1280, // Mayor resolución
  height: 720,
  facingMode: 'environment'
};

// Función para iniciar la cámara con manejo de errores
async function startCamera() {
  try {
    await camera.start();
  } catch (err) {
    console.log("Error al iniciar cámara trasera:", err);
    camera.setOptions({ 
      ...cameraOptions,
      facingMode: 'user',
      width: 640, // Menor resolución como fallback
      height: 480
    });
    try {
      await camera.start();
    } catch (innerErr) {
      console.error("Error al iniciar cualquier cámara:", innerErr);
      instructions.textContent = "No se pudo acceder a la cámara. Por favor, verifica los permisos.";
    }
  }
}

const camera = new Camera(videoElement, cameraOptions);
startCamera();

// Manejo mejorado de orientación del dispositivo
if (window.DeviceOrientationEvent) {
  // Usar un temporizador para limitar las actualizaciones
  let orientationUpdateTimer = null;
  window.addEventListener("deviceorientation", (event) => {
    if (!orientationUpdateTimer) {
      orientationUpdateTimer = setTimeout(() => {
        const alpha = event.alpha || 0; // Rotación en el eje Z
        const beta = event.beta || 0; // Inclinación adelante/atrás (X)
        const gamma = event.gamma || 0; // Inclinación izquierda/derecha (Y)
        const camera = document.querySelector('a-camera');
        camera.setAttribute('rotation', `${beta} ${alpha} ${-gamma}`);
        orientationUpdateTimer = null;
      }, 50); // Actualizar máximo 20 veces por segundo
    }
  });
}

// Asegurar que estas variables estén disponibles
window.drawConnectors = window.drawConnectors || drawingUtils.drawConnectors;
window.drawLandmarks = window.drawLandmarks || drawingUtils.drawLandmarks;
window.HAND_CONNECTIONS = window.HAND_CONNECTIONS || hands.HAND_CONNECTIONS;