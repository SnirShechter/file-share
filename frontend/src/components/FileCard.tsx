import { useState } from 'react';
import type { FileItem } from '../hooks/useFiles.js';
import DownloadStats from './DownloadStats.js';

interface FileCardProps {
  file: FileItem;
  token: string | null;
  sessionId: string | null;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'הרגע';
  if (diffMins < 60) return `לפני ${diffMins} דקות`;
  if (diffHours < 24) return `לפני ${diffHours} שעות`;
  return `לפני ${diffDays} ימים`;
}

function formatExpiryTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMs < 0) return 'פג תוקף';
  if (diffHours < 1) return 'פחות משעה';
  if (diffHours < 24) return `${diffHours} שעות`;
  return `${diffDays} ימים`;
}

export default function FileCard({ file, token, sessionId }: FileCardProps) {
  const [showStats, setShowStats] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const handleCopyCode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(file.code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-surface-hover transition-colors"
        onClick={() => setShowStats(!showStats)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-medium text-gray-800 truncate">{file.filename}</h3>
            <span className="text-xs text-gray-400 shrink-0">
              {formatFileSize(file.fileSize)}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>הועלה {formatRelativeTime(file.uploadedAt)}</span>
            <span>תוקף: {formatExpiryTime(file.expiresAt)}</span>
            <span>{file.downloadCount} הורדות</span>
          </div>
        </div>

        <div className="flex items-center gap-3 mr-4">
          <button
            onClick={handleCopyCode}
            className="code-display flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-mono font-bold text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
            title="העתק קוד"
          >
            {codeCopied ? 'הועתק!' : file.code}
          </button>
          <span className={`text-gray-400 transition-transform ${showStats ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </div>

      {showStats && (
        <div className="border-t border-border">
          <DownloadStats fileId={file.id} token={token} sessionId={sessionId} />
        </div>
      )}
    </div>
  );
}
