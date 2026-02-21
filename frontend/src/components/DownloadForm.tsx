import { useState, useRef, useCallback, type KeyboardEvent, type ClipboardEvent } from 'react';
import toast from 'react-hot-toast';
import { apiClient, apiJson } from '../api/client.js';

interface FileMetadata {
  filename: string;
  fileSize: number;
  mimeType: string;
}

export default function DownloadForm() {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState<FileMetadata | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const code = digits.join('');
  const isComplete = code.length === 6 && digits.every((d) => d !== '');

  const updateDigit = useCallback((index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleKeyDown = useCallback((index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [digits]);

  const handlePaste = useCallback((e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      const newDigits = [...digits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setDigits(newDigits);
      const focusIndex = Math.min(pasted.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  }, [digits]);

  const handleLookup = async () => {
    if (!isComplete) return;
    setIsLoading(true);
    setMetadata(null);

    try {
      const data = await apiJson<FileMetadata>(`/download/${code}`);
      setMetadata(data);
    } catch {
      toast.error('קובץ לא נמצא או שפג תוקפו');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!isComplete) return;
    setIsLoading(true);

    try {
      const response = await apiClient(`/download/${code}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const filename = metadata?.filename || 'download';

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('הקובץ הורד בהצלחה!');
    } catch {
      toast.error('שגיאה בהורדת הקובץ');
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-white rounded-xl border border-border p-6">
      <div className="flex flex-col items-center gap-4">
        {/* Digit inputs */}
        <div className="digit-input flex gap-2" dir="ltr">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => updateDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              className="w-12 h-14 text-center text-2xl font-bold border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              disabled={isLoading}
            />
          ))}
        </div>

        {/* File metadata preview */}
        {metadata && (
          <div className="text-center text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-2">
            <p className="font-medium">{metadata.filename}</p>
            <p>{formatFileSize(metadata.fileSize)}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          {!metadata ? (
            <button
              onClick={handleLookup}
              disabled={!isComplete || isLoading}
              className="px-6 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {isLoading ? 'מחפש...' : 'חפש קובץ'}
            </button>
          ) : (
            <button
              onClick={handleDownload}
              disabled={isLoading}
              className="px-6 py-2.5 rounded-lg bg-success text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {isLoading ? 'מוריד...' : 'הורד קובץ'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
