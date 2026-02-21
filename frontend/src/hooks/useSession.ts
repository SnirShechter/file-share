import { useState } from 'react';

export function useSession() {
  const [sessionId] = useState(() => {
    let id = localStorage.getItem('sessionId');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('sessionId', id);
    }
    return id;
  });

  const clearSession = () => localStorage.removeItem('sessionId');

  return { sessionId, clearSession };
}
