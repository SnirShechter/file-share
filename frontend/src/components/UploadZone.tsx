import { useState, useRef, useCallback, type DragEvent } from 'react';
import toast from 'react-hot-toast';

interface UploadResult {
  id: string;
  code: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  expiresAt: string;
}

interface UploadZoneProps {
  token: string | null;
  sessionId: string | null;
  onUploadComplete: (result: UploadResult) => void;
}

export default function UploadZone({ token, sessionId, onUploadComplete }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    setIsUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Use XMLHttpRequest for progress tracking
      const result = await new Promise<UploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/upload');

        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        if (sessionId) {
          xhr.setRequestHeader('X-Session-Id', sessionId);
        }

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status === 201) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            const body = JSON.parse(xhr.responseText);
            reject(new Error(body.error || 'Upload failed'));
          }
        };

        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(formData);
      });

      onUploadComplete(result);
      toast.success(`${file.name} הועלה בהצלחה!`);
    } catch (err: any) {
      toast.error(err.message || 'שגיאה בהעלאה');
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, [token, sessionId, onUploadComplete]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleFileSelect = useCallback(() => {
    const file = fileInputRef.current?.files?.[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isUploading && fileInputRef.current?.click()}
      className={`
        relative rounded-xl border-2 border-dashed p-12 text-center transition-all cursor-pointer
        ${isDragging
          ? 'border-primary bg-blue-50 scale-[1.02]'
          : 'border-gray-300 hover:border-primary hover:bg-gray-50'
        }
        ${isUploading ? 'pointer-events-none opacity-75' : ''}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
      />

      {isUploading ? (
        <div className="space-y-4">
          <div className="text-4xl">📤</div>
          <p className="text-gray-600 text-lg">מעלה... {progress}%</p>
          <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-3">
            <div
              className="bg-primary rounded-full h-3 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-5xl">📁</div>
          <p className="text-gray-700 text-lg font-medium">
            גרור קובץ לכאן או לחץ לבחירה
          </p>
          <p className="text-gray-400 text-sm">
            גודל מקסימלי: 100MB &middot; הקובץ ימחק אוטומטית לאחר 7 ימים
          </p>
        </div>
      )}
    </div>
  );
}
