'use client';

import { useState, useCallback } from 'react';
import { Upload, BookOpen, Mic2, FileText, Briefcase } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { uploadContents } from '@/lib/api';

const CONTENT_TYPES = [
  { label: 'Book / Chapter', icon: BookOpen, accept: '.pdf,.doc,.docx,.txt' },
  { label: 'Talk Transcript', icon: FileText, accept: '.pdf,.doc,.docx,.txt' },
  { label: 'Voice Sample', icon: Mic2, accept: '.mp3,.wav,.m4a' },
  { label: 'Media Kit', icon: Briefcase, accept: '.pdf,.doc,.docx,.zip' },
];

export default function ContentSidebar() {
  const { state } = useAppState();
  const [activeType, setActiveType] = useState('Book / Chapter');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || !state.speakerId) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      formData.append('content_type', activeType);
      await uploadContents(state.speakerId, formData);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  }, [state.speakerId, activeType]);

  const currentType = CONTENT_TYPES.find(t => t.label === activeType)!;

  return (
    <div className="w-[280px] shrink-0">
      <h3 className="text-xs font-semibold text-gray-500 tracking-wider mb-3">YOUR CONTENT & IP</h3>

      {/* Type buttons */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {CONTENT_TYPES.map(({ label, icon: Icon }) => (
          <button key={label}
            onClick={() => setActiveType(label)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border transition-colors ${
              activeType === label
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}>
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Upload area */}
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
          dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50/50'
        }`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}>
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-2">
            <Upload size={18} className="text-blue-500" />
          </div>
          <p className="text-sm font-medium mb-1">Drop your file here</p>
          <label className="text-xs text-blue-600 cursor-pointer hover:underline">
            or click to browse
            <input type="file" className="hidden"
              accept={currentType.accept}
              onChange={e => handleUpload(e.target.files)}
              disabled={uploading} />
          </label>
          <p className="text-[10px] text-gray-400 mt-2">
            {activeType} · up to 50 MB · 1 file at a time
          </p>
          <div className="flex gap-2 mt-2">
            {currentType.accept.split(',').map(ext => (
              <span key={ext} className="text-[10px] text-gray-400 bg-white px-2 py-0.5 rounded border">
                {ext}
              </span>
            ))}
          </div>
        </div>
      </div>

      <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
        Your uploads train your AI persona — improving pitch language, topic framing, and conference match quality over time.
      </p>

      {uploading && (
        <div className="mt-3 text-xs text-blue-600 flex items-center gap-1.5">
          <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          Uploading...
        </div>
      )}
    </div>
  );
}
