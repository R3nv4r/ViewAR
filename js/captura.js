document.addEventListener('DOMContentLoaded', function() {
  const saveButton = document.getElementById('save-button');
  const downloadLink = document.getElementById('download-link');
  const overlayCanvas = document.getElementById('overlay');
  const overlayContext = overlayCanvas.getContext('2d');

  // Detectar la escena A-Frame
  const scene = document.querySelector('a-scene');
  if (!scene) {
    console.error('A-Frame scene not found');
    return;
  }

  // Obtener el elemento de video que MindAR usa internamente
  let video;
  const waitForVideo = setInterval(() => {
    video = document.querySelector('video');
    if (video) {
      clearInterval(waitForVideo);
      initializeOverlay();
    }
  }, 100);

  // Ajustar las dimensiones del overlay y dibujar las líneas de guía
  function initializeOverlay() {
    // Ajustar las dimensiones del overlay para que coincidan con el video
    const videoContainer = document.querySelector('.video-container');
    overlayCanvas.width = videoContainer.clientWidth;
    overlayCanvas.height = videoContainer.clientHeight;

    // Dibujar las líneas de guía (ajusta los valores según el diseño de tu app)
    const margin = 50; // Margen para las líneas de guía (ajusta según la segunda imagen)
    overlayContext.strokeStyle = 'white';
    overlayContext.lineWidth = 2;
    overlayContext.beginPath();
    // Línea superior
    overlayContext.moveTo(margin, margin);
    overlayContext.lineTo(overlayCanvas.width - margin, margin);
    // Línea inferior
    overlayContext.moveTo(margin, overlayCanvas.height - margin);
    overlayContext.lineTo(overlayCanvas.width - margin, overlayCanvas.height - margin);
    overlayContext.stroke();
  }

  // Manejar el evento de captura
  saveButton.addEventListener('click', function() {
    // Determinar tipo de AR
    const isFaceAR = scene.hasAttribute('mindar-face');
    const isImageAR = scene.hasAttribute('mindar-image');
    const isHandAR = document.querySelector('.output_canvas') !== null;

    if (!video) {
      console.error('Video element not found');
      return;
    }

    // Crear un canvas temporal para la composición final
    const tempCanvas = document.createElement('canvas');
    const tempContext = tempCanvas.getContext('2d');

    // Configurar el canvas con las dimensiones correctas
    if (isHandAR) {
      const mediaCanvas = document.querySelector('.output_canvas');
      tempCanvas.width = mediaCanvas.width;
      tempCanvas.height = mediaCanvas.height;
    } else {
      const canvas = scene.renderer.domElement;
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
    }

    // Asegurar que la escena AR esté renderizada
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

    // Crear un segundo canvas para recortar la imagen según las líneas de guía
    const finalCanvas = document.createElement('canvas');
    const finalContext = finalCanvas.getContext('2d');

    // Calcular el área dentro de las líneas de guía
    const margin = 50; // Debe coincidir con el margen usado para dibujar las líneas
    const cropWidth = overlayCanvas.width - 2 * margin;
    const cropHeight = overlayCanvas.height - 2 * margin;

    // Ajustar las dimensiones del canvas final
    finalCanvas.width = cropWidth;
    finalCanvas.height = cropHeight;

    // Recortar la imagen para que solo incluya el área dentro de las líneas de guía
    finalContext.drawImage(
      tempCanvas,
      margin, margin, cropWidth, cropHeight, // Área de origen (dentro de las líneas)
      0, 0, cropWidth, cropHeight // Área de destino
    );

    // Convertir el canvas final a un blob y guardar la imagen
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
  });
});