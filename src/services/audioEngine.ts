import { AudioMetrics, Track, AmbientChannel } from '../types/audio';

class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private musicGainNode: GainNode | null = null;

  // Analysis buffers
  private frequencyData: Uint8Array | null = null;
  private timeData: Uint8Array | null = null;
  private prevBass = 0;
  private beatDecay = 0;

  // Playback state
  private playlist: Track[] = [];
  private currentTrackIndex = -1;
  private isPlaying = false;
  private isMuted = false;
  private volume = 0.85;
  private isShuffle = false;
  private repeatMode: 'off' | 'all' | 'one' = 'all';

  // Ambient synth engine
  private ambientGainNode: GainNode | null = null;
  private ambientMasterVolume = 0.6;
  private ambientNodes: Map<
    string,
    {
      source: AudioNode[];
      gain: GainNode;
      active: boolean;
    }
  > = new Map();

  // Callbacks
  private onTrackChangeCallbacks: Array<(track: Track | null) => void> = [];
  private onPlaybackStateCallbacks: Array<(isPlaying: boolean) => void> = [];
  private onTimeUpdateCallbacks: Array<(currentTime: number, duration: number) => void> = [];
  private onPlaylistChangeCallbacks: Array<(playlist: Track[]) => void> = [];

  constructor() {
    // Audio elements will be initialized on first user interaction
  }

  private initAudio() {
    if (this.audioCtx && this.audioElement) return;

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audioCtx = new AudioContextClass();

    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';
    this.audioElement.preload = 'auto';

    // Hook events
    this.audioElement.addEventListener('timeupdate', () => {
      if (this.audioElement) {
        const cur = this.audioElement.currentTime || 0;
        const dur = this.audioElement.duration || 0;
        this.onTimeUpdateCallbacks.forEach((cb) => cb(cur, dur));
      }
    });

    this.audioElement.addEventListener('ended', () => {
      this.handleTrackEnded();
    });

    this.audioElement.addEventListener('error', (e) => {
      console.warn('Audio playback error', e);
      this.isPlaying = false;
      this.notifyPlaybackState();
    });

    // Create audio nodes
    this.sourceNode = this.audioCtx.createMediaElementSource(this.audioElement);
    this.analyserNode = this.audioCtx.createAnalyser();
    this.analyserNode.fftSize = 2048;
    this.analyserNode.smoothingTimeConstant = 0.82;

    this.musicGainNode = this.audioCtx.createGain();
    this.musicGainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);

    // Ambient master gain
    this.ambientGainNode = this.audioCtx.createGain();
    this.ambientGainNode.gain.setValueAtTime(this.ambientMasterVolume, this.audioCtx.currentTime);
    this.ambientGainNode.connect(this.audioCtx.destination);

    // Music routing: Source -> Analyser -> MusicGain -> Destination
    this.sourceNode.connect(this.analyserNode);
    this.analyserNode.connect(this.musicGainNode);
    this.musicGainNode.connect(this.audioCtx.destination);

    const bufferLength = this.analyserNode.frequencyBinCount;
    this.frequencyData = new Uint8Array(bufferLength);
    this.timeData = new Uint8Array(bufferLength);
  }

  public async resumeContext(): Promise<void> {
    if (!this.audioCtx) {
      this.initAudio();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
  }

  // --- Playback Controls ---

  public async play(): Promise<void> {
    this.initAudio();
    await this.resumeContext();

    if (!this.audioElement) return;

    if (this.currentTrackIndex === -1 && this.playlist.length > 0) {
      await this.selectTrack(0);
      return;
    }

    try {
      await this.audioElement.play();
      this.isPlaying = true;
      this.notifyPlaybackState();
    } catch (err) {
      console.warn('Playback failed', err);
      this.isPlaying = false;
      this.notifyPlaybackState();
    }
  }

  public pause(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.isPlaying = false;
      this.notifyPlaybackState();
    }
  }

  public togglePlay(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public seek(timeSeconds: number): void {
    if (this.audioElement && Number.isFinite(timeSeconds)) {
      this.audioElement.currentTime = Math.max(0, Math.min(timeSeconds, this.audioElement.duration || 0));
    }
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.musicGainNode && this.audioCtx) {
      this.musicGainNode.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.audioCtx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.musicGainNode && this.audioCtx) {
      this.musicGainNode.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.audioCtx.currentTime);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public toggleShuffle(): boolean {
    this.isShuffle = !this.isShuffle;
    return this.isShuffle;
  }

  public getIsShuffle(): boolean {
    return this.isShuffle;
  }

  public cycleRepeat(): 'off' | 'all' | 'one' {
    if (this.repeatMode === 'off') this.repeatMode = 'all';
    else if (this.repeatMode === 'all') this.repeatMode = 'one';
    else this.repeatMode = 'off';
    return this.repeatMode;
  }

  public getRepeatMode(): 'off' | 'all' | 'one' {
    return this.repeatMode;
  }

  public async nextTrack(): Promise<void> {
    if (this.playlist.length === 0) return;

    if (this.isShuffle && this.playlist.length > 1) {
      let nextIndex = Math.floor(Math.random() * this.playlist.length);
      while (nextIndex === this.currentTrackIndex) {
        nextIndex = Math.floor(Math.random() * this.playlist.length);
      }
      await this.selectTrack(nextIndex);
      return;
    }

    let nextIndex = this.currentTrackIndex + 1;
    if (nextIndex >= this.playlist.length) {
      if (this.repeatMode === 'off') {
        this.pause();
        this.seek(0);
        return;
      }
      nextIndex = 0;
    }
    await this.selectTrack(nextIndex);
  }

  public async prevTrack(): Promise<void> {
    if (this.playlist.length === 0) return;

    // If more than 3 seconds in, restart track
    if (this.audioElement && this.audioElement.currentTime > 3) {
      this.seek(0);
      return;
    }

    let prevIndex = this.currentTrackIndex - 1;
    if (prevIndex < 0) {
      prevIndex = this.playlist.length - 1;
    }
    await this.selectTrack(prevIndex);
  }

  public async selectTrack(index: number): Promise<void> {
    if (index < 0 || index >= this.playlist.length) return;
    this.initAudio();
    await this.resumeContext();

    this.currentTrackIndex = index;
    const track = this.playlist[index];

    if (this.audioElement) {
      this.audioElement.src = track.url;
      this.audioElement.load();
      try {
        await this.audioElement.play();
        this.isPlaying = true;
      } catch (e) {
        console.warn('Autoplay blocked or load error', e);
        this.isPlaying = false;
      }
    }

    this.notifyTrackChange();
    this.notifyPlaybackState();
  }

  private handleTrackEnded() {
    if (this.repeatMode === 'one') {
      this.seek(0);
      this.play();
    } else {
      this.nextTrack();
    }
  }

  // --- Playlist Management ---

  public getPlaylist(): Track[] {
    return [...this.playlist];
  }

  public getCurrentTrack(): Track | null {
    if (this.currentTrackIndex >= 0 && this.currentTrackIndex < this.playlist.length) {
      return this.playlist[this.currentTrackIndex];
    }
    return null;
  }

  public getCurrentTrackIndex(): number {
    return this.currentTrackIndex;
  }

  public addTracks(newTracks: Track[]): void {
    const wasEmpty = this.playlist.length === 0;
    this.playlist = [...this.playlist, ...newTracks];
    this.notifyPlaylistChange();

    if (wasEmpty && this.playlist.length > 0) {
      this.selectTrack(0);
    }
  }

  public removeTrack(id: string): void {
    const index = this.playlist.findIndex((t) => t.id === id);
    if (index === -1) return;

    const [removed] = this.playlist.splice(index, 1);
    if (removed && removed.url.startsWith('blob:') && !removed.isProcedural) {
      URL.revokeObjectURL(removed.url);
    }

    if (this.currentTrackIndex === index) {
      if (this.playlist.length === 0) {
        this.pause();
        this.currentTrackIndex = -1;
        if (this.audioElement) this.audioElement.src = '';
      } else {
        const nextIndex = Math.min(index, this.playlist.length - 1);
        this.selectTrack(nextIndex);
      }
    } else if (this.currentTrackIndex > index) {
      this.currentTrackIndex--;
    }

    this.notifyPlaylistChange();
    this.notifyTrackChange();
  }

  public clearPlaylist(): void {
    this.pause();
    this.playlist.forEach((t) => {
      if (t.url.startsWith('blob:') && !t.isProcedural) {
        URL.revokeObjectURL(t.url);
      }
    });
    this.playlist = [];
    this.currentTrackIndex = -1;
    if (this.audioElement) this.audioElement.src = '';
    this.notifyPlaylistChange();
    this.notifyTrackChange();
  }

  // --- Real-Time Analysis Feed ---

  public getMetrics(): AudioMetrics {
    if (!this.analyserNode || !this.frequencyData || !this.timeData) {
      return {
        bass: 0,
        mid: 0,
        treble: 0,
        energy: 0,
        beat: false,
        beatIntensity: 0,
        frequencyData: new Uint8Array(0),
        timeData: new Uint8Array(0),
        rms: 0,
      };
    }

    this.analyserNode.getByteFrequencyData(this.frequencyData as any);
    this.analyserNode.getByteTimeDomainData(this.timeData as any);

    const binCount = this.analyserNode.frequencyBinCount;

    // Sub-bass & Bass: ~20Hz to ~250Hz (bins 1 to 14)
    let bassSum = 0;
    const bassEnd = Math.min(14, binCount);
    for (let i = 1; i < bassEnd; i++) {
      bassSum += this.frequencyData[i];
    }
    const rawBass = bassSum / (bassEnd - 1) / 255;

    // Midrange: ~250Hz to ~4000Hz (bins 15 to 185)
    let midSum = 0;
    const midEnd = Math.min(185, binCount);
    for (let i = bassEnd; i < midEnd; i++) {
      midSum += this.frequencyData[i];
    }
    const rawMid = midSum / (midEnd - bassEnd) / 255;

    // Treble: ~4000Hz to ~16000Hz (bins 186 to 740)
    let trebleSum = 0;
    const trebleEnd = Math.min(740, binCount);
    for (let i = midEnd; i < trebleEnd; i++) {
      trebleSum += this.frequencyData[i];
    }
    const rawTreble = trebleSum / (trebleEnd - midEnd) / 255;

    // RMS amplitude from time data
    let rmsSum = 0;
    for (let i = 0; i < binCount; i++) {
      const val = (this.timeData[i] - 128) / 128;
      rmsSum += val * val;
    }
    const rms = Math.sqrt(rmsSum / binCount);
    const energy = Math.min(1, (rawBass * 0.45 + rawMid * 0.35 + rawTreble * 0.2) * 1.2);

    // Beat detection
    const bassDelta = rawBass - this.prevBass;
    const isBeat = bassDelta > 0.16 && rawBass > 0.4;
    if (isBeat) {
      this.beatDecay = 1.0;
    } else {
      this.beatDecay = Math.max(0, this.beatDecay * 0.88);
    }
    this.prevBass = rawBass;

    return {
      bass: rawBass,
      mid: rawMid,
      treble: rawTreble,
      energy,
      beat: isBeat,
      beatIntensity: this.beatDecay,
      frequencyData: this.frequencyData,
      timeData: this.timeData,
      rms,
    };
  }

  // --- Procedural Ambient Mixer ---

  public setAmbientMasterVolume(vol: number): void {
    this.ambientMasterVolume = Math.max(0, Math.min(1, vol));
    if (this.ambientGainNode && this.audioCtx) {
      this.ambientGainNode.gain.setValueAtTime(this.ambientMasterVolume, this.audioCtx.currentTime);
    }
  }

  public getAmbientMasterVolume(): number {
    return this.ambientMasterVolume;
  }

  public setAmbientChannel(id: AmbientChannel['id'], active: boolean, volume: number, muted: boolean): void {
    this.initAudio();
    if (!this.audioCtx || !this.ambientGainNode) return;

    let nodeData = this.ambientNodes.get(id);

    if (active && !nodeData) {
      nodeData = this.createAmbientSynthesizer(id);
      this.ambientNodes.set(id, nodeData);
    }

    if (nodeData) {
      nodeData.active = active;
      const targetGain = !active || muted ? 0 : volume;
      nodeData.gain.gain.linearRampToValueAtTime(targetGain, this.audioCtx.currentTime + 0.15);
    }
  }

  private createAmbientSynthesizer(id: AmbientChannel['id']) {
    if (!this.audioCtx || !this.ambientGainNode) {
      throw new Error('Audio context not ready');
    }

    const ctx = this.audioCtx;
    const channelGain = ctx.createGain();
    channelGain.gain.setValueAtTime(0, ctx.currentTime);
    channelGain.connect(this.ambientGainNode);

    const sources: AudioNode[] = [];

    // Helper for generating white/pink/brown noise buffer
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    if (id === 'rain') {
      // Pinkish noise with random droplet filter
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.15;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, ctx.currentTime);

      noise.connect(filter);
      filter.connect(channelGain);
      noise.start();
      sources.push(noise, filter);
    } else if (id === 'wind') {
      // Filtered noise with slow sine LFO modulation
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, ctx.currentTime);
      filter.Q.setValueAtTime(2.5, ctx.currentTime);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.2, ctx.currentTime);
      lfoGain.gain.setValueAtTime(220, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      noise.connect(filter);
      filter.connect(channelGain);
      noise.start();
      lfo.start();
      sources.push(noise, filter, lfo, lfoGain);
    } else if (id === 'fire') {
      // Crackle generator: noise with random pops
      for (let i = 0; i < bufferSize; i++) {
        const r = Math.random();
        if (r > 0.997) {
          output[i] = (Math.random() * 2 - 1) * 0.9;
        } else {
          output[i] = (Math.random() * 2 - 1) * 0.04;
        }
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, ctx.currentTime);

      noise.connect(filter);
      filter.connect(channelGain);
      noise.start();
      sources.push(noise, filter);
    } else if (id === 'ocean') {
      // Ocean surf: dual low-pass noise swept with slow 0.08Hz sine wave
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500, ctx.currentTime);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.08, ctx.currentTime);
      lfoGain.gain.setValueAtTime(380, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      noise.connect(filter);
      filter.connect(channelGain);
      noise.start();
      lfo.start();
      sources.push(noise, filter, lfo, lfoGain);
    } else if (id === 'brown') {
      // Brownian / red noise: integrated white noise
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      noise.connect(channelGain);
      noise.start();
      sources.push(noise);
    } else {
      // Pink noise: 1/f noise
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      noise.connect(channelGain);
      noise.start();
      sources.push(noise);
    }

    return {
      source: sources,
      gain: channelGain,
      active: true,
    };
  }

  // --- Subscriptions ---

  public onTrackChange(cb: (track: Track | null) => void): () => void {
    this.onTrackChangeCallbacks.push(cb);
    cb(this.getCurrentTrack());
    return () => {
      this.onTrackChangeCallbacks = this.onTrackChangeCallbacks.filter((c) => c !== cb);
    };
  }

  public onPlaybackState(cb: (isPlaying: boolean) => void): () => void {
    this.onPlaybackStateCallbacks.push(cb);
    cb(this.isPlaying);
    return () => {
      this.onPlaybackStateCallbacks = this.onPlaybackStateCallbacks.filter((c) => c !== cb);
    };
  }

  public onTimeUpdate(cb: (currentTime: number, duration: number) => void): () => void {
    this.onTimeUpdateCallbacks.push(cb);
    return () => {
      this.onTimeUpdateCallbacks = this.onTimeUpdateCallbacks.filter((c) => c !== cb);
    };
  }

  public onPlaylistChange(cb: (playlist: Track[]) => void): () => void {
    this.onPlaylistChangeCallbacks.push(cb);
    cb(this.playlist);
    return () => {
      this.onPlaylistChangeCallbacks = this.onPlaylistChangeCallbacks.filter((c) => c !== cb);
    };
  }

  private notifyTrackChange() {
    const cur = this.getCurrentTrack();
    this.onTrackChangeCallbacks.forEach((cb) => cb(cur));
  }

  private notifyPlaybackState() {
    this.onPlaybackStateCallbacks.forEach((cb) => cb(this.isPlaying));
  }

  private notifyPlaylistChange() {
    this.onPlaylistChangeCallbacks.forEach((cb) => cb(this.playlist));
  }
}

export const audioEngine = new AudioEngine();
