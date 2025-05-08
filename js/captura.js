document.addEventListener('DOMContentLoaded', function() {
  const saveButton = document.getElementById('save-button');
  const downloadLink = document.getElementById('download-link');

  saveButton.addEventListener('click', function() {
    // Detectar qué tipo de AR estamos usando
    const scene = document.querySelector('a-scene');
    if (!scene) {
      console.error('A-Frame scene not found');
      return;
    }

    // Crear un canvas temporal para la composición final
    const tempCanvas = document.createElement('canvas');
    
    // Determinar tipo de AR
    const isFaceAR = scene.hasAttribute('mindar-face');
    const isImageAR = scene.hasAttribute('mindar-image');
    const isHandAR = document.querySelector('.output_canvas') !== null;
    
    // Configurar el canvas con las dimensiones correctas
    if (isHandAR) {
      // Para AR de manos, usa las dimensiones del canvas de MediaPipe
      const mediaCanvas = document.querySelector('.output_canvas');
      tempCanvas.width = mediaCanvas.width;
      tempCanvas.height = mediaCanvas.height;
    } else {
      // Para MindAR, usa las dimensiones del renderer de A-Frame
      const canvas = scene.renderer.domElement;
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
    }
    
    const tempContext = tempCanvas.getContext('2d');
    
    if (isHandAR) {
      // Para AR de manos (MediaPipe)
      const mediaCanvas = document.querySelector('.output_canvas');
      const video = document.querySelector('.input_video');
      
      // Asegurar que el modelo 3D se renderice
      scene.renderer.render(scene.object3D, scene.camera);
      
      // Primero dibujamos el video/canvas de MediaPipe que ya tiene detección de manos
      tempContext.drawImage(mediaCanvas, 0, 0, tempCanvas.width, tempCanvas.height);
      
      // Luego superponemos los elementos 3D de A-Frame
      tempContext.drawImage(scene.renderer.domElement, 0, 0, tempCanvas.width, tempCanvas.height);
    } else {
      // Para MindAR (imagen o cara)
      const canvas = scene.renderer.domElement;
      const video = document.querySelector('video');
      
      if (!video) {
        console.error('Video element not found');
        return;
      }
      
      // Asegurar que la escena AR esté renderizada
      scene.renderer.render(scene.object3D, scene.camera);

      if (isFaceAR) {
        // Para AR facial, mantén el efecto espejo
        tempContext.translate(tempCanvas.width, 0);
        tempContext.scale(-1, 1);
        tempContext.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
        tempContext.setTransform(1, 0, 0, 1, 0, 0);
      } else {
        // Para AR de imagen, sin efecto espejo
        tempContext.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
      }
      
      // Superponer los elementos AR
      tempContext.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
    }

    // Convertir el canvas temporal a un blob y guardar la imagen
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