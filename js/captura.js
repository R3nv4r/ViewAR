document.addEventListener('DOMContentLoaded', function() {
  const saveButton = document.getElementById('save-button');
  const downloadLink = document.getElementById('download-link');

  saveButton.addEventListener('click', function() {
    const scene = document.querySelector('a-scene');
    if (!scene) {
      console.error('A-Frame scene not found');
      return;
    }

    scene.addEventListener('loaded', function() {
      const canvas = scene.renderer.domElement;
      if (!canvas) {
        console.error('Canvas not found');
        return;
      }

      const video = document.querySelector('video');
      if (!video) {
        console.error('Video element not found');
        return;
      }

      scene.renderer.render(scene.object3D, scene.camera);

      const videoAspectRatio = video.videoWidth / video.videoHeight;
      const canvasAspectRatio = canvas.width / canvas.height;

      let tempCanvasWidth, tempCanvasHeight;
      if (videoAspectRatio > canvasAspectRatio) {
        tempCanvasWidth = canvas.width;
        tempCanvasHeight = canvas.width / videoAspectRatio;
      } else {
        tempCanvasHeight = canvas.height;
        tempCanvasWidth = canvas.height * videoAspectRatio;
      }

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = tempCanvasWidth;
      tempCanvas.height = tempCanvasHeight;
      const tempContext = tempCanvas.getContext('2d');

      tempContext.translate(tempCanvas.width, 0);
      tempContext.scale(-1, 1);

      tempContext.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

      tempContext.setTransform(1, 0, 0, 1, 0, 0);

      tempContext.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);

      tempCanvas.toBlob(function(blob) {
        if (!blob) {
          console.error('Failed to capture canvas');
          return;
        }

        const url = URL.createObjectURL(blob);
        downloadLink.href = url;
        downloadLink.download = 'captura.png';
        downloadLink.click();
      }, 'image/png');
    });
  });
});