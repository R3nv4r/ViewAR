document.addEventListener('DOMContentLoaded', function () {
    const loadingScreen = document.getElementById('loading-screen');
    const scene = document.querySelector('a-scene');

    function hideLoadingScreen() {
        if (loadingScreen) {
            console.log('Hiding loading screen');
            // Add a fade-out effect by setting opacity to 0
            loadingScreen.style.opacity = '0';

            // Wait for the fade-out transition to complete before hiding the element
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 3000); // Match the duration of the CSS transition
        }
    }

    // Fallback timeout
    const fallbackTimeout = setTimeout(() => {
        console.warn('Fallback: Hiding loading screen after timeout');
        hideLoadingScreen();
    }, 10000);

    if (scene) {
        // Wait for the A-Frame scene to be ready
        scene.addEventListener('loaded', function () {
            console.log('A-Frame scene loaded');
            hideLoadingScreen();
            clearTimeout(fallbackTimeout);
        }, { once: true });

        // Also try with the MindAR event
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