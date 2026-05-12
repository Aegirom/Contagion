import { useRef } from 'react';
import { useArtifactStore } from '../../stores/artifactStore';

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

function ArtifactUploader() {
  const inputRef = useRef(null);
  const { selectedFile, uploadedArtifact, uploadProgress, uploadStatus, error, selectFile } = useArtifactStore();

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) selectFile(file);
  };

  return (
    <div className="space-y-3">
      <label className="font-code text-[10px] uppercase tracking-widest block" style={{ color: '#9CA3AF' }}>
        Malware Artifact
      </label>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(event) => event.preventDefault()}
        className="w-full rounded-lg border border-dashed px-4 py-6 text-left transition-all hover:border-[#22C55E]/40"
        style={{ background: '#F9FAFB', borderColor: 'rgba(229,231,235,0.9)' }}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(event) => selectFile(event.target.files?.[0] || null)}
        />

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-display text-sm font-bold" style={{ color: '#111827' }}>
              {selectedFile ? selectedFile.name : 'Drop artifact here or browse'}
            </p>
            <p className="mt-1 font-code text-[10px]" style={{ color: '#6B7280' }}>
              {selectedFile ? `${formatBytes(selectedFile.size)} • ${selectedFile.type || 'application/octet-stream'}` : 'Uploaded to Cloudflare R2 quarantine storage'}
            </p>
          </div>
          <span className="rounded border px-3 py-1 font-code text-[10px] uppercase tracking-widest" style={{ color: '#22C55E', borderColor: 'rgba(34,197,94,0.3)' }}>
            Select
          </span>
        </div>
      </button>

      {uploadStatus !== 'idle' && uploadStatus !== 'selected' && (
        <div className="rounded border border-[rgba(229,231,235,0.8)] bg-[#FFFFFF] p-3">
          <div className="flex items-center justify-between font-code text-[10px] uppercase tracking-widest">
            <span style={{ color: '#6B7280' }}>{uploadStatus}</span>
            <span style={{ color: '#22C55E' }}>{uploadProgress}%</span>
          </div>
          <div className="mt-2 h-2 rounded bg-gray-100">
            <div className="h-2 rounded bg-[#22C55E]" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {uploadedArtifact && (
        <div className="rounded border border-green-900/40 bg-green-900/10 p-3 font-code text-[11px]" style={{ color: '#86EFAC' }}>
          Artifact #{uploadedArtifact.artifact_id} ready • SHA-256 {uploadedArtifact.sha256_hash}
        </div>
      )}

      {error && (
        <div className="rounded border border-red-900/40 bg-red-900/10 p-3 font-code text-[11px] text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}

export default ArtifactUploader;
