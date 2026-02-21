const API_BASE = '/api';

interface FetchOptions extends RequestInit {
  sessionId?: string;
  token?: string;
}

export async function apiClient(
  path: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { sessionId, token, headers: extraHeaders, ...rest } = options;

  const headers = new Headers(extraHeaders);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (sessionId) {
    headers.set('X-Session-Id', sessionId);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers,
  });

  return response;
}

export async function apiJson<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const response = await apiClient(path, options);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(response.status, body.error || 'Request failed');
  }

  return response.json();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
