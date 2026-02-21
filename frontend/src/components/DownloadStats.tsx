import { useQuery } from '@tanstack/react-query';
import { apiJson } from '../api/client.js';

interface StatsResponse {
  fileId: string;
  filename: string;
  downloadCount: number;
  downloads: { downloadedAt: string }[];
}

interface DownloadStatsProps {
  fileId: string;
  token: string | null;
  sessionId: string | null;
}

function formatDateTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DownloadStats({ fileId, token, sessionId }: DownloadStatsProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['stats', fileId],
    queryFn: () =>
      apiJson<StatsResponse>(`/files/${fileId}/stats`, {
        token: token || undefined,
        sessionId: sessionId || undefined,
      }),
  });

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-400 text-sm">טוען סטטיסטיקות...</div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 text-center text-gray-400 text-sm">שגיאה בטעינת הנתונים</div>
    );
  }

  if (data.downloads.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400 text-sm">אין הורדות עדיין</div>
    );
  }

  return (
    <div className="p-4">
      <h4 className="text-sm font-medium text-gray-600 mb-3">
        היסטוריית הורדות ({data.downloadCount})
      </h4>
      <div className="space-y-1.5">
        {data.downloads.map((dl, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            <span>{formatDateTime(dl.downloadedAt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
