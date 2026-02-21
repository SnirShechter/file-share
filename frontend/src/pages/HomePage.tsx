import { useState } from 'react';
import UploadZone from '../components/UploadZone.js';
import CodeDisplay from '../components/CodeDisplay.js';
import DownloadForm from '../components/DownloadForm.js';
import FileList from '../components/FileList.js';
import { useAuth } from '../auth/useAuth.js';
import { useSession } from '../hooks/useSession.js';
import { useFiles } from '../hooks/useFiles.js';
import { useWebSocket } from '../hooks/useWebSocket.js';

interface UploadResult {
  id: string;
  code: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  expiresAt: string;
}

export default function HomePage() {
  const { token, isAuthenticated } = useAuth();
  const { sessionId } = useSession();
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const effectiveToken = isAuthenticated ? token : null;
  const effectiveSessionId = isAuthenticated ? null : sessionId;

  const { data: files, refetch } = useFiles(effectiveToken, effectiveSessionId);

  // WebSocket for live notifications
  const ownerKey = isAuthenticated
    ? `user:${token}`
    : sessionId
      ? `session:${sessionId}`
      : null;

  useWebSocket(ownerKey, effectiveToken, effectiveSessionId);

  const handleUploadComplete = (result: UploadResult) => {
    setUploadResult(result);
    refetch();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Upload Section */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">העלאת קובץ</h2>
        <UploadZone
          token={effectiveToken}
          sessionId={effectiveSessionId}
          onUploadComplete={handleUploadComplete}
        />
        {uploadResult && (
          <div className="mt-4">
            <CodeDisplay code={uploadResult.code} filename={uploadResult.filename} />
          </div>
        )}
      </section>

      {/* Divider */}
      <div className="border-t border-gray-200" />

      {/* Download Section */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">הורדת קובץ</h2>
        <DownloadForm />
      </section>

      {/* Divider */}
      <div className="border-t border-gray-200" />

      {/* File List Section */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">הקבצים שלי</h2>
        <FileList
          files={files || []}
          token={effectiveToken}
          sessionId={effectiveSessionId}
        />
      </section>
    </div>
  );
}
