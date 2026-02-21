import { useQuery } from '@tanstack/react-query';
import { apiJson } from '../api/client.js';

interface FileItem {
  id: string;
  code: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  expiresAt: string;
  downloadCount: number;
}

interface FilesResponse {
  files: FileItem[];
}

export function useFiles(token: string | null, sessionId: string | null) {
  return useQuery({
    queryKey: ['files', token, sessionId],
    queryFn: async () => {
      const data = await apiJson<FilesResponse>('/files', {
        token: token || undefined,
        sessionId: sessionId || undefined,
      });
      return data.files;
    },
    enabled: !!(token || sessionId),
    refetchOnWindowFocus: true,
  });
}

export type { FileItem };
