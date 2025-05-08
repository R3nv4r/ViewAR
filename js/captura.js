document.addEventListener('DOMContentLoaded', function() {
  const saveButton = document.getElementById('save-button');
  const downloadLink = document.getElementById('download-link');
  const overlayCanvas = document.getElementById('overlay');

  if (!overlayCanvas) {
    console.error('Overlay canvas not found. Please ensure <canvas id="overlay"> exists in the HTML.');
    return;
  }

  const overlayContext = overlayCanvas.getContext('2d');
  if (!overlayContext) {
    console.error('Failed to get 2D context for overlay canvas.');
    return;
  }

  const scene = document.querySelector('a-scene');
  if (!scene) {
    console.error('A-Frame scene not found');
    return;
  }

  let video;
  const waitForVideo = setInterval(() => {
    video = document.querySelector('video');
    if (video && video.videoWidth > 0 && video.videoHeight > 0) {
      clearInterval(waitForVideo);
      initializeOverlay();
    }
  }, 100);

  function initializeOverlay() {
    try {
      const videoContainer = document.querySelector('.video-container');
      if (!videoContainer) {
        console.error('Video container not found');
        return;
      }

      overlayCanvas.width = videoContainer.clientWidth;
      overlayCanvas.height = videoContainer.clientHeight;

      const videoAspect = video.videoWidth / video.videoHeight;
      const containerAspect = overlayCanvas.width / overlayCanvas.height;
      let videoWidth, videoHeight, offsetX, offsetY;

      if (videoAspect > containerAspect) {
        videoHeight = overlayCanvas.height;
        videoWidth = videoHeight * videoAspect;
        offsetX = (overlayCanvas.width - videoWidth) / 2;
        offsetY = 0;
      } else {
        videoWidth = overlayCanvas.width;
        videoHeight = videoWidth / videoAspect;
        offsetX = 0;
        offsetY = (overlayCanvas.height - videoHeight) / 2;
      }

      // Calcular márgenes dinámicamente según las dimensiones de la pantalla
      // Definimos un margen base en píxeles y lo ajustamos según el tamaño de la pantalla
      const baseMarginX = 20; // Margen base en píxeles para los lados
      const baseMarginY = 40; // Margen base en píxeles para arriba y abajo
      const minMarginPercent = 0.05; // Mínimo margen porcentual (5%)
      const maxMarginPercent = 0.2;  // Máximo margen porcentual (20%)

      // Calcular márgenes como un porcentaje del tamaño, pero con límites
      let marginXPercent = baseMarginX / videoWidth;
      let marginYPercent = baseMarginY / videoHeight;

      // Asegurar que los márgenes estén dentro de los límites
      marginXPercent = Math.max(minMarginPercent, Math.min(marginXPercent, maxMarginPercent));
      marginYPercent = Math.max(minMarginPercent, Math.min(marginYPercent, maxMarginPercent));

      // Calcular los márgenes en píxeles
      const marginX = videoWidth * marginXPercent;
      const marginY = videoHeight * marginYPercent;
      const guideX = offsetX + marginX;
      const guideY = offsetY + marginY;
      const guideWidth = videoWidth - 2 * marginX;
      const guideHeight = videoHeight - 2 * marginY;
    } catch (error) {
      console.error('Error initializing overlay:', error);
    }
  }

  saveButton.addEventListener('click', function() {
    try {
      const scene = document.querySelector('a-scene');
      const video = document.querySelector('video');

      if (!scene || !scene.renderer) {
        console.error('A-Frame scene or renderer not found');
        return;
      }

      if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
        console.error('Video element not found or not ready');
        return;
      }

      // Use the video feed's resolution for the canvas
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      // Create a temporary canvas for the final composition
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = videoWidth;
      tempCanvas.height = videoHeight;
      const tempContext = tempCanvas.getContext('2d');

      // Ensure the AR scene is rendered at the same resolution
      
      scene.renderer.render(scene.object3D, scene.camera);

      // Draw the video feed onto the temporary canvas (background)
    
      tempContext.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

      // Reset the transformation matrix
      tempContext.setTransform(1, 0, 0, 1, 0, 0);

      // Draw the AR scene onto the temporary canvas (foreground)
      const canvas = scene.renderer.domElement;
      tempContext.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);

      // Convert the temporary canvas to a blob and save the image
      tempCanvas.toBlob(function(blob) {
        if (!blob) {
          console.error('Failed to capture canvas');
          return;
        }

        // Generate a filename using the current date and time
        const now = new Date();
        const formattedDate = now.toISOString().replace(/:/g, '-').split('.')[0]; // Format: YYYY-MM-DDTHH-MM-SS
        const filename = `captura_${formattedDate}.png`;

        const url = URL.createObjectURL(blob);
        downloadLink.href = url;
        downloadLink.download = filename;
        downloadLink.click();
      }, 'image/png');
    } catch (error) {
      console.error('Error capturing image:', error);
    }
  });
});