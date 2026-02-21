import type { FileItem } from '../hooks/useFiles.js';
import FileCard from './FileCard.js';

interface FileListProps {
  files: FileItem[];
  token: string | null;
  sessionId: string | null;
}

export default function FileList({ files, token, sessionId }: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="text-4xl mb-3">📂</div>
        <p>אין קבצים עדיין. העלה קובץ כדי להתחיל!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {files.map((file) => (
        <FileCard key={file.id} file={file} token={token} sessionId={sessionId} />
      ))}
    </div>
  );
}
