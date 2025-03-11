const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const instructions = document.getElementById('instructions');
let firstDetection = true;
let lastPosition = { x: 0, y: 0, z: 0 };

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
    const handedness = results.multiHandedness[0].label; // 'Left' or 'Right'

    // Display the handedness on the canvas
    canvasCtx.font = '30px Arial';
    canvasCtx.fillStyle = 'white';
    canvasCtx.fillText(handedness === 'Left' ? 'L' : 'R', 10, 50);

    const isOpenPalm = landmarks[8].y < landmarks[6].y && 
                       landmarks[12].y < landmarks[10].y && 
                       landmarks[16].y < landmarks[14].y && 
                       landmarks[20].y < landmarks[18].y;

    const isClosedFist = landmarks[8].y > landmarks[6].y && 
                         landmarks[12].y > landmarks[10].y;

    if (isOpenPalm) {
      handModel.setAttribute('visible', true);
    } else if (isClosedFist) {
      handModel.setAttribute('visible', false);
    }

    const distance = Math.sqrt(
      Math.pow(landmarks[0].x - landmarks[9].x, 2) +
      Math.pow(landmarks[0].y - landmarks[9].y, 2)
    );
    const scale = distance * 2;
    handModel.setAttribute('scale', `${scale} ${scale} ${scale}`);

    const palmCenter = {
      x: (landmarks[0].x + landmarks[5].x + landmarks[9].x + landmarks[13].x + landmarks[17].x) / 5,
      y: (landmarks[0].y + landmarks[5].y + landmarks[9].y + landmarks[13].y + landmarks[17].y) / 5,
      z: (landmarks[0].z + landmarks[5].z + landmarks[9].z + landmarks[13].z + landmarks[17].z) / 5
    };

    const targetX = (palmCenter.x - 0.5) * 3;
    const targetY = (0.5 - palmCenter.y) * 2;
    const targetZ = -1 * (palmCenter.z + 0.5);

    const smoothingFactor = 0.3;
    lastPosition.x += (targetX - lastPosition.x) * smoothingFactor;
    lastPosition.y += (targetY - lastPosition.y) * smoothingFactor;
    lastPosition.z += (targetZ - lastPosition.z) * smoothingFactor;
    handModel.setAttribute('position', `${lastPosition.x} ${lastPosition.y} ${lastPosition.z}`);

    const dx = landmarks[9].x - landmarks[0].x;
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