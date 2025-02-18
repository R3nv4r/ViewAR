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

    // Ensure the canvas is rendered before capturing
    scene.renderer.render(scene.object3D);
    scene.renderer.render(scene.camera, scene.object3D);
    
    canvas.toBlob(function(blob) {
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