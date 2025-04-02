document.addEventListener('DOMContentLoaded', function() {
  const saveButton = document.getElementById('save-button');
  const downloadLink = document.getElementById('download-link');

  saveButton.addEventListener('click', function() {
    const scene = document.querySelector('a-scene');
    if (!scene) {
      console.error('A-Frame scene not found');
      return;
    }

    const canvas = scene.renderer.domElement;
    if (!canvas) {
      console.error('Canvas not found');
      return;
    }

    // Get the video element from the camera feed
    const video = document.querySelector('video');
    if (!video) {
      console.error('Video element not found');
      return;
    }

    // Ensure the canvas is rendered before capturing
    scene.renderer.render(scene.object3D, scene.camera);

    // Create a temporary canvas to draw the video feed
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempContext = tempCanvas.getContext('2d');
    
    // Detectar si esta es una aplicación de AR facial o de AR de imagen
    const isFaceAR = scene.hasAttribute('mindar-face');
    
    if (isFaceAR) {
      // Para AR facial, mantén el efecto espejo (como antes)
      tempContext.translate(tempCanvas.width, 0);
      tempContext.scale(-1, 1);
      tempContext.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
      tempContext.setTransform(1, 0, 0, 1, 0, 0);
    } else {
      // Para AR de imagen, dibuja el video sin transformación (sin espejo)
      tempContext.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
    }

    // Draw the AR scene onto the temporary canvas (foreground)
    // En ambos casos, los elementos AR se dibujan encima sin espejo
    tempContext.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);

    // Convert the temporary canvas to a blob and save the image
    tempCanvas.toBlob(function(blob) {
      if (!blob) {
        console.error('Failed to capture canvas');
        return;
      }
      
      const now = new Date();
      const formattedDate = now.toISOString().replace(/:/g, '-').split('.')[0]; // Formato: AAAA-MM-DDTHH-MM-SS
      const filename = `captura_${formattedDate}.png`;

      const url = URL.createObjectURL(blob);
      downloadLink.href = url;
      downloadLink.download = filename;
      downloadLink.click();
    }, 'image/png');
  });
});