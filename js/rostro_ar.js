document.addEventListener('DOMContentLoaded', function() {
  const saveButton = document.getElementById('save-button');
  const downloadLink = document.getElementById('download-link');

  saveButton.addEventListener('click', function() {
    // Access the A-Frame scene
    const scene = document.querySelector('a-scene');
    if (!scene || !scene.renderer) {
      console.error('A-Frame scene or renderer not found');
      return;
    }

    // Access the video feed
    const video = document.querySelector('video');
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
    tempContext.translate(tempCanvas.width, 0); // Mirror effect for facial AR
    tempContext.scale(-1, 1);
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
  });
});
