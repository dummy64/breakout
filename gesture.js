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
    const SMOOTHING = 0.5; // higher = more responsive
    const EDGE_MIN = 0.15; // hand rarely goes below this
    const EDGE_MAX = 0.85; // hand rarely goes above this
    const video = document.getElementById('webcam');
    let camera = null;

    // Expand a narrow input range to full 0..1
    function expandRange(val) {
        return Math.max(0, Math.min(1, (val - EDGE_MIN) / (EDGE_MAX - EDGE_MIN)));
    }

    // Initialize MediaPipe Hands
    const hands = new Hands({
        locateFile: function (file) {
            return 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/' + file;
        }
    });

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0,   // 0 = lite, fastest
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.4
    });

    hands.onResults(onResults);

    function onResults(results) {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            var lm = results.multiHandLandmarks[0];
            // Landmark 9 = middle finger MCP (palm center proxy)
            var rawX = lm[9].x;
            // Mirror: webcam is mirrored, so 0 on cam = right side of screen
            var mirrored = 1 - rawX;
            // Expand range so hand doesn't need to reach camera extremes
            var expanded = expandRange(mirrored);
            // Smooth via lerp
            window.gestureState.paddleX += (expanded - window.gestureState.paddleX) * SMOOTHING;
            window.gestureState.rawX = expanded;
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
