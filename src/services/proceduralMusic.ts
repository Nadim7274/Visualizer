import { Track } from '../types/audio';

// Fast WAV encoder for AudioBuffer to Blob
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const numSamples = buffer.length * numChannels;
  const dataSize = numSamples * (bitDepth / 8);
  const headerSize = 44;
  const arrayBuffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(arrayBuffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // file length minus RIFF identifier and length bytes
  view.setUint32(4, 36 + dataSize, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, format, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  // bits per sample
  view.setUint16(34, bitDepth, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, dataSize, true);

  // Write interleaved PCM samples
  const channelData: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channelData.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = channelData[c][i];
      // Clamp between -1 and 1
      sample = Math.max(-1, Math.min(1, sample));
      // Scale to 16-bit signed integer
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Procedurally render a demo track using an OfflineAudioContext.
 * This runs in a few milliseconds and gives the user real music immediately!
 */
export async function generateDemoTrack(
  type: 'astral' | 'pulse' | 'echoes'
): Promise<Track> {
  const sampleRate = 44100;

  if (type === 'astral') {
    const duration = 28;
    const ctx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

    // Chords progression: Dm9 -> Bbmaj7 -> Fmaj7 -> C6
    const chordFrequencies = [
      [146.83, 220.0, 261.63, 329.63, 440.0], // D3, A3, C4, E4, A4
      [116.54, 174.61, 233.08, 293.66, 349.23], // Bb2, F3, Bb3, D4, F4
      [87.31, 174.61, 261.63, 329.63, 392.0], // F2, F3, C4, E4, G4
      [130.81, 196.0, 261.63, 329.63, 392.0], // C3, G3, C4, E4, G4
    ];

    const chordDuration = duration / chordFrequencies.length;

    // Master bus
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.7, 0);
    masterGain.connect(ctx.destination);

    // Convolver/reverb impulse
    const reverb = createSimpleReverb(ctx, 3.5, 2.0);
    reverb.connect(masterGain);

    chordFrequencies.forEach((chord, step) => {
      const startTime = step * chordDuration;
      const endTime = startTime + chordDuration;

      // Lush warm pad oscillators
      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        // Subtle detune for shimmer
        osc.detune.setValueAtTime((idx % 2 === 0 ? 1 : -1) * 8, startTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600 + idx * 250, startTime);
        filter.frequency.exponentialRampToValueAtTime(1400, startTime + 2);
        filter.frequency.exponentialRampToValueAtTime(500, endTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.12 / chord.length, startTime + 1.2);
        gain.gain.setValueAtTime(0.12 / chord.length, endTime - 0.8);
        gain.gain.linearRampToValueAtTime(0.001, endTime);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        gain.connect(reverb);

        osc.start(startTime);
        osc.stop(endTime);
      });

      // Sub bass
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(chord[0] / 2, startTime);

      subGain.gain.setValueAtTime(0.001, startTime);
      subGain.gain.linearRampToValueAtTime(0.35, startTime + 0.3);
      subGain.gain.setValueAtTime(0.35, endTime - 0.4);
      subGain.gain.linearRampToValueAtTime(0.001, endTime);

      subOsc.connect(subGain);
      subGain.connect(masterGain);
      subOsc.start(startTime);
      subOsc.stop(endTime);
    });

    // Melodic sparkling arpeggio notes across the track
    const arpNotes = [440.0, 523.25, 659.25, 783.99, 880.0, 1046.5];
    const arpInterval = 0.35;
    for (let t = 2; t < duration - 2; t += arpInterval) {
      if (Math.random() > 0.3) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const note = arpNotes[Math.floor(Math.random() * arpNotes.length)];
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.08, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);

        osc.connect(gain);
        gain.connect(reverb);
        gain.connect(masterGain);

        osc.start(t);
        osc.stop(t + 1);
      }
    }

    const renderedBuffer = await ctx.startRendering();
    const blob = audioBufferToWav(renderedBuffer);
    const url = URL.createObjectURL(blob);

    return {
      id: 'demo-astral',
      title: 'Astral Drift',
      artist: 'AETHER Synthesizer',
      duration,
      url,
      isProcedural: true,
      addedAt: Date.now(),
    };
  } else if (type === 'pulse') {
    const duration = 24;
    const ctx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.65, 0);
    masterGain.connect(ctx.destination);

    // 120 BPM = 0.5s per beat
    const beatInterval = 0.5;

    // Kick drum on each beat
    for (let t = 0; t < duration; t += beatInterval) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, t);
      osc.frequency.exponentialRampToValueAtTime(38, t + 0.12);

      gain.gain.setValueAtTime(0.6, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.3);
    }

    // Driving rolling bassline (16th notes)
    const baseFreqs = [55, 55, 65.4, 73.4, 55, 55, 82.4, 73.4];
    const sixteenth = beatInterval / 4;
    for (let t = 0; t < duration; t += sixteenth) {
      const step = Math.floor(t / sixteenth) % baseFreqs.length;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(baseFreqs[step], t);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800 + Math.sin(t * 0.8) * 400, t);
      filter.Q.setValueAtTime(4, t);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + sixteenth * 0.85);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(t);
      osc.stop(t + sixteenth);
    }

    // Synth lead riff
    const leadNotes = [220, 261.6, 329.6, 392, 440, 523.2];
    for (let t = 4; t < duration - 2; t += beatInterval) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const note = leadNotes[Math.floor((t * 2) % leadNotes.length)];
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + beatInterval * 0.9);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + beatInterval);
    }

    const renderedBuffer = await ctx.startRendering();
    const blob = audioBufferToWav(renderedBuffer);
    const url = URL.createObjectURL(blob);

    return {
      id: 'demo-pulse',
      title: 'Cyber Pulse',
      artist: 'AETHER Synthesizer',
      duration,
      url,
      isProcedural: true,
      addedAt: Date.now() + 1,
    };
  } else {
    // Echoes - Meditative Shimmer
    const duration = 30;
    const ctx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.6, 0);
    masterGain.connect(ctx.destination);
    const reverb = createSimpleReverb(ctx, 4.0, 2.5);
    reverb.connect(masterGain);

    const pentatonic = [196.0, 220.0, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];
    // Gentle melodic drops with long decay
    for (let t = 1; t < duration - 3; t += 1.8) {
      const note = pentatonic[Math.floor(Math.sin(t * 0.5) * 4 + 4)];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);

      osc.connect(gain);
      gain.connect(reverb);
      gain.connect(masterGain);

      osc.start(t);
      osc.stop(t + 3.0);
    }

    // Deep singing bowl drone
    const drone = ctx.createOscillator();
    const droneGain = ctx.createGain();
    drone.type = 'sine';
    drone.frequency.setValueAtTime(110, 0);
    droneGain.gain.setValueAtTime(0.18, 0);
    drone.connect(droneGain);
    droneGain.connect(masterGain);
    drone.start(0);
    drone.stop(duration);

    const renderedBuffer = await ctx.startRendering();
    const blob = audioBufferToWav(renderedBuffer);
    const url = URL.createObjectURL(blob);

    return {
      id: 'demo-echoes',
      title: 'Echoes of Silence',
      artist: 'AETHER Synthesizer',
      duration,
      url,
      isProcedural: true,
      addedAt: Date.now() + 2,
    };
  }
}

// Algorithmic impulse response for rich spatial reverb
function createSimpleReverb(ctx: BaseAudioContext, duration: number, decay: number): ConvolverNode {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const impulse = ctx.createBuffer(2, length, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const factor = Math.exp(-i / (sampleRate * (duration / decay)));
    left[i] = (Math.random() * 2 - 1) * factor;
    right[i] = (Math.random() * 2 - 1) * factor;
  }

  const convolver = ctx.createConvolver();
  convolver.buffer = impulse;
  return convolver;
}
