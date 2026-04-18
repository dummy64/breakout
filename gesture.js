/**
 * gesture.js – MediaPipe Hands integration for paddle control.
 * Exposes window.gestureState for script.js to consume.
 */

window.gestureState = {
    active: false,       // true when a hand is currently detected
    handDetected: false,  // true once a hand has been seen at least once
    paddleX: 0.5,        // normalized 0..1 (left..right), mirrored
    rawX: 0.5
};

(function () {
    const SMOOTHING = 0.25; // lower = smoother, higher = more responsive
    const video = document.getElementById('webcam');
    let camera = null;

    // Initialize MediaPipe Hands
    const hands = new Hands({
        locateFile: function (file) {
            return 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/' + file;
        }
    });

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0,   // 0 = lite, fastest
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5
    });

    hands.onResults(onResults);

    function onResults(results) {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            var lm = results.multiHandLandmarks[0];
            // Landmark 9 = middle finger MCP (palm center proxy)
            var rawX = lm[9].x;
            // Mirror: webcam is mirrored, so 0 on cam = right side of screen
            var mirrored = 1 - rawX;
            // Smooth via lerp
            window.gestureState.paddleX += (mirrored - window.gestureState.paddleX) * SMOOTHING;
            window.gestureState.rawX = mirrored;
            window.gestureState.active = true;
            window.gestureState.handDetected = true;
        } else {
            window.gestureState.active = false;
        }
    }

    // Start camera
    function startCamera() {
        camera = new Camera(video, {
            onFrame: async function () {
                await hands.send({ image: video });
            },
            width: 320,
            height: 240
        });
        camera.start();
    }

    // Kick off once DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startCamera);
    } else {
        startCamera();
    }
})();
