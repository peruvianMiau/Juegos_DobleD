// Loop chiptune original y muy simple (8-bit), generado con Web Audio API.
// No es música de Pokémon (por derechos de autor no se puede incluir),
// pero da un ambiente retro similar mientras juegas.

let ctx = null;
let playing = false;
let timerId = null;
let step = 0;

const MELODY = [523.25, 659.25, 783.99, 659.25, 523.25, 392.0, 523.25, 659.25];
const BASS = [130.81, 130.81, 164.81, 130.81];

function playTone(freq, startTime, duration, type, volume) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

function scheduleStep() {
  if (!playing) return;
  const now = ctx.currentTime;
  playTone(MELODY[step % MELODY.length], now, 0.2, 'square', 0.06);
  if (step % 2 === 0) {
    playTone(BASS[(step / 2) % BASS.length], now, 0.4, 'triangle', 0.05);
  }
  step++;
  timerId = setTimeout(scheduleStep, 220);
}

export function toggleMusic() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (playing) {
    playing = false;
    clearTimeout(timerId);
    return false;
  }
  ctx.resume();
  playing = true;
  scheduleStep();
  return true;
}

export function isMusicPlaying() {
  return playing;
}
