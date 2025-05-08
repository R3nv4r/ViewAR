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
/*
      overlayCanvas.dataset.guideX = guideX || 0;
      overlayCanvas.dataset.guideY = guideY || 0;
      overlayCanvas.dataset.guideWidth = guideWidth || overlayCanvas.width;
      overlayCanvas.dataset.guideHeight = guideHeight || overlayCanvas.height;
      overlayCanvas.dataset.offsetX = offsetX || 0;
      overlayCanvas.dataset.offsetY = offsetY || 0;
      overlayCanvas.dataset.videoWidth = videoWidth || overlayCanvas.width;
      overlayCanvas.dataset.videoHeight = videoHeight || overlayCanvas.height;

      overlayContext.strokeStyle = 'white';
      overlayContext.lineWidth = 2;
      overlayContext.beginPath();
      overlayContext.moveTo(guideX, guideY);
      overlayContext.lineTo(guideX + guideWidth, guideY);
      overlayContext.moveTo(guideX, guideY + guideHeight);
      overlayContext.lineTo(guideX + guideWidth, guideY + guideHeight);
      overlayContext.stroke();*/
    } catch (error) {
      console.error('Error initializing overlay:', error);
    }
  }

  saveButton.addEventListener('click', function() {
    try {
      const isFaceAR = scene.hasAttribute('mindar-face');
      const isImageAR = scene.hasAttribute('mindar-image');
      const isHandAR = document.querySelector('.output_canvas') !== null;

      if (!video) {
        console.error('Video element not found');
        return;
      }

      const tempCanvas = document.createElement('canvas');
      const tempContext = tempCanvas.getContext('2d');

      if (isHandAR) {
        const mediaCanvas = document.querySelector('.output_canvas');
        tempCanvas.width = mediaCanvas.width;
        tempCanvas.height = mediaCanvas.height;
      } else {
        const canvas = scene.renderer.domElement;
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
      }

      scene.renderer.render(scene.object3D, scene.camera);

      if (isHandAR) {
        const mediaCanvas = document.querySelector('.output_canvas');
        tempContext.drawImage(mediaCanvas, 0, 0, tempCanvas.width, tempCanvas.height);
        tempContext.drawImage(scene.renderer.domElement, 0, 0, tempCanvas.width, tempCanvas.height);
      } else {
        if (isFaceAR) {
          tempContext.translate(tempCanvas.width, 0);
          tempContext.scale(-1, 1);
          tempContext.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
          tempContext.setTransform(1, 0, 0, 1, 0, 0);
        } else {
          tempContext.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
        }
        tempContext.drawImage(scene.renderer.domElement, 0, 0, tempCanvas.width, tempCanvas.height);
      }

      const finalCanvas = document.createElement('canvas');
      const finalContext = finalCanvas.getContext('2d');

      const guideX = parseFloat(overlayCanvas.dataset.guideX) || 0;
      const guideY = parseFloat(overlayCanvas.dataset.guideY) || 0;
      const guideWidth = parseFloat(overlayCanvas.dataset.guideWidth) || tempCanvas.width;
      const guideHeight = parseFloat(overlayCanvas.dataset.guideHeight) || tempCanvas.height;
      const offsetX = parseFloat(overlayCanvas.dataset.offsetX) || 0;
      const offsetY = parseFloat(overlayCanvas.dataset.offsetY) || 0;
      const videoWidth = parseFloat(overlayCanvas.dataset.videoWidth) || tempCanvas.width;
      const videoHeight = parseFloat(overlayCanvas.dataset.videoHeight) || tempCanvas.height;

      finalCanvas.width = guideWidth;
      finalCanvas.height = guideHeight;

      const scaleX = tempCanvas.width / videoWidth;
      const scaleY = tempCanvas.height / videoHeight;
      const scaledGuideX = (guideX - offsetX) * scaleX;
      const scaledGuideY = (guideY - offsetY) * scaleY;
      const scaledGuideWidth = guideWidth * scaleX;
      const scaledGuideHeight = guideHeight * scaleY;

      if (isNaN(scaledGuideX) || isNaN(scaledGuideY) || isNaN(scaledGuideWidth) || isNaN(scaledGuideHeight)) {
        console.error('Invalid crop dimensions:', { scaledGuideX, scaledGuideY, scaledGuideWidth, scaledGuideHeight });
        return;
      }

      const safeScaledGuideX = Math.max(0, Math.min(scaledGuideX, tempCanvas.width - scaledGuideWidth));
      const safeScaledGuideY = Math.max(0, Math.min(scaledGuideY, tempCanvas.height - scaledGuideHeight));
      const safeScaledGuideWidth = Math.min(scaledGuideWidth, tempCanvas.width - safeScaledGuideX);
      const safeScaledGuideHeight = Math.min(scaledGuideHeight, tempCanvas.height - safeScaledGuideY);

      finalContext.drawImage(
        tempCanvas,
        safeScaledGuideX, safeScaledGuideY, safeScaledGuideWidth, safeScaledGuideHeight,
        0, 0, guideWidth, guideHeight
      );

      finalCanvas.toBlob(function(blob) {
        if (!blob) {
          console.error('Failed to capture canvas');
          return;
        }

        const now = new Date();
        const formattedDate = now.toISOString().replace(/:/g, '-').split('.')[0];
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