/**
 * Restrained tactile feedback for web preview & mobile.
 * Uses navigator.vibrate when available and subtle audio synthetic thud for tactile sensation.
 */

let audioCtx: AudioContext | null = null;

export function triggerHaptic(type: 'light' | 'medium' | 'success' | 'selection' = 'light', enabled = true) {
  if (!enabled || typeof window === 'undefined') return;

  // 1. Native vibration if supported (Android & mobile browsers)
  if ('vibrate' in navigator) {
    try {
      if (type === 'light' || type === 'selection') {
        navigator.vibrate(10);
      } else if (type === 'medium') {
        navigator.vibrate(25);
      } else if (type === 'success') {
        navigator.vibrate([15, 40, 20]);
      }
    } catch {
      // Ignore vibration errors
    }
  }

  // 2. Soft tactile micro-sound (extremely subtle low-frequency thud, 50-80Hz, 0.03 volume)
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }

    if (audioCtx && audioCtx.state === 'running') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      const freq = type === 'success' ? 140 : type === 'medium' ? 95 : 75;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      const duration = type === 'success' ? 0.08 : 0.03;
      gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    }
  } catch {
    // Audio context may be suspended before user interaction
  }
}

/**
 * Enhanced tactile vibration & meditation singing bowl chime for exercise completion.
 * Triggers pattern vibration on device and synthesizes a soft resonant bell.
 */
export function triggerExerciseCompletionFeedback(enabled = true) {
  if (!enabled || typeof window === 'undefined') return;

  // 1. Phone vibration (distinct rhythm for celebration)
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate([180, 80, 180, 80, 450]);
    } catch {
      // Ignore vibration errors
    }
  }

  // 2. Soothing singing bowl chime
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!audioCtx && AudioContextClass) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx) {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const now = audioCtx.currentTime;

      // Primary tone (528 Hz - Solfeggio frequency for calm)
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(528, now);
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 1.8);

      // Soft harmonic overtone (1056 Hz)
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1056, now);
      gain2.gain.setValueAtTime(0.03, now);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now);
      osc2.stop(now + 1.2);
    }
  } catch {
    // AudioContext might be blocked or unavailable
  }
}

