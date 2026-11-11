// src/vision/opencv.js
// Singleton loader and initializer for OpenCV.js runtime

let cvInstance = null;
let cvPromise = null;

/**
 * Loads and initializes @techstark/opencv-js once and returns the ready cv object.
 * Handles both Promise resolution and onRuntimeInitialized callback forms.
 *
 * @returns {Promise<object>} Initialized OpenCV runtime
 */
async function getCV() {
  if (cvInstance) {
    return cvInstance;
  }
  if (cvPromise) {
    return cvPromise;
  }

  cvPromise = new Promise((resolve, reject) => {
    try {
      const cvModule = require('@techstark/opencv-js');

      // 1. Handle Promise / Thenable form
      if (cvModule && typeof cvModule.then === 'function') {
        cvModule
          .then((cv) => {
            cvInstance = cv;
            resolve(cv);
          })
          .catch(reject);
        return;
      }

      // 2. Handle already initialized Mat object
      if (cvModule && typeof cvModule.Mat === 'function') {
        cvInstance = cvModule;
        resolve(cvModule);
        return;
      }

      // 3. Handle onRuntimeInitialized callback form
      if (cvModule) {
        cvModule.onRuntimeInitialized = () => {
          cvInstance = cvModule;
          resolve(cvModule);
        };
      }
    } catch (err) {
      reject(err);
    }
  });

  return cvPromise;
}

module.exports = {
  getCV,
};

