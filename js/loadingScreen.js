document.addEventListener('DOMContentLoaded', function () {
    const loadingScreen = document.getElementById('loading-screen');
    const scene = document.querySelector('a-scene');

    function hideLoadingScreen() {
        if (loadingScreen) {
            console.log('Hiding loading screen');
            loadingScreen.style.display = 'none';
        }
    }

    // Fallback timeout
    const fallbackTimeout = setTimeout(() => {
        console.warn('Fallback: Hiding loading screen after timeout');
        hideLoadingScreen();
    }, 10000);

    if (scene) {
        // Esperar a que la escena de A-Frame esté lista
        scene.addEventListener('loaded', function () {
            console.log('A-Frame scene loaded');
            hideLoadingScreen();
            clearTimeout(fallbackTimeout);
        }, { once: true });

        // También intentar con el evento de MindAR
        scene.addEventListener('targetFound', function () {
            console.log('MindAR target found');
            hideLoadingScreen();
            clearTimeout(fallbackTimeout);
        }, { once: true });
    } else {
        console.error('A-Frame scene not found');
        hideLoadingScreen();
        clearTimeout(fallbackTimeout);
    }
});