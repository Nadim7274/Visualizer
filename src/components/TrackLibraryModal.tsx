import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Search,
  Trash2,
  Play,
  Volume2,
  Sparkles,
  Music,
} from 'lucide-react';
import { Track } from '../types/audio';
import { audioEngine } from '../services/audioEngine';
import { generateDemoTrack } from '../services/proceduralMusic';

interface TrackLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
}

export function TrackLibraryModal({
  isOpen,
  onClose,
  playlist,
  currentTrack,
  isPlaying,
}: TrackLibraryModalProps) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'added' | 'title' | 'duration'>('added');
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newTracks: Track[] = [];
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      // Clean fallback title from filename
      const title = file.name.replace(/\.[^/.]+$/, '');
      newTracks.push({
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        title,
        artist: 'Local Audio',
        duration: 0, // will populate on metadata load
        url,
        file,
        addedAt: Date.now(),
      });
    });

    audioEngine.addTracks(newTracks);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddDemo = async (type: 'astral' | 'pulse' | 'echoes') => {
    try {
      setIsGeneratingDemo(true);
      const demo = await generateDemoTrack(type);
      audioEngine.addTracks([demo]);
    } catch (err) {
      console.error('Failed to generate demo track', err);
    } finally {
      setIsGeneratingDemo(false);
    }
  };

  const filteredPlaylist = playlist
    .filter(
      (t) =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.artist.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'duration') return b.duration - a.duration;
      return b.addedAt - a.addedAt;
    });

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="flex flex-col w-full max-w-2xl h-[80vh] bg-[#0c0e15] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <Music className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white tracking-wide">Audio Library & Queue</h3>
            <span className="text-xs text-slate-400">({playlist.length} tracks)</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar: Search, Sort, Upload */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-white/5 bg-slate-950/40 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search library..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900/70 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Sort tabs */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-900/80 border border-white/10 rounded-lg text-xs">
            <button
              onClick={() => setSortBy('added')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                sortBy === 'added' ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => setSortBy('title')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                sortBy === 'title' ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Title
            </button>
          </div>

          {/* Add file trigger */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Audio</span>
          </button>
        </div>

        {/* Demo Tracks Bar */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-cyan-950/20 border-b border-cyan-500/15 text-xs">
          <div className="flex items-center gap-1.5 text-cyan-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate In-Browser Demo:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAddDemo('astral')}
              disabled={isGeneratingDemo}
              className="px-2.5 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 transition-colors disabled:opacity-50"
            >
              + Astral Drift
            </button>
            <button
              onClick={() => handleAddDemo('pulse')}
              disabled={isGeneratingDemo}
              className="px-2.5 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 transition-colors disabled:opacity-50"
            >
              + Cyber Pulse
            </button>
            <button
              onClick={() => handleAddDemo('echoes')}
              disabled={isGeneratingDemo}
              className="px-2.5 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 transition-colors disabled:opacity-50"
            >
              + Echoes
            </button>
          </div>
        </div>

        {/* Track List */}
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1.5">
          {filteredPlaylist.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500">
              <Music className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm font-medium">No tracks found</p>
              <p className="text-xs text-slate-600 mt-1">Upload your audio files or add a synthesized demo track above.</p>
            </div>
          ) : (
            filteredPlaylist.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              const originalIndex = playlist.findIndex((t) => t.id === track.id);
              return (
                <div
                  key={track.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-white'
                      : 'bg-slate-900/40 border-white/5 text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div
                    onClick={() => audioEngine.selectTrack(originalIndex)}
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 text-slate-400 shrink-0">
                      {isCurrent && isPlaying ? (
                        <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />
                      ) : (
                        <Play className="w-3.5 h-3.5 ml-0.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium truncate text-white">{track.title}</span>
                        {track.isProcedural && (
                          <span className="text-[10px] text-cyan-400/80">· Procedural</span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 truncate block">{track.artist}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 pl-2">
                    <span className="font-mono-nums text-xs text-slate-400">
                      {track.duration ? formatDuration(track.duration) : '--:--'}
                    </span>
                    <button
                      onClick={() => audioEngine.removeTrack(track.id)}
                      className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Remove from queue"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {playlist.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-white/10 bg-slate-950/60 text-xs text-slate-400">
            <span>Audio files processed entirely in-browser. Never uploaded to servers.</span>
            <button
              onClick={() => {
                if (window.confirm('Clear all tracks from the queue?')) {
                  audioEngine.clearPlaylist();
                }
              }}
              className="text-rose-400 hover:text-rose-300 transition-colors"
            >
              Clear Library
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
