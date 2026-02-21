import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from './useAuth.js';
import { apiJson } from '../api/client.js';

export function useOidcCallback() {
  const { handleCallback } = useAuth();
  const navigate = useNavigate();
  const processing = useRef(false);

  useEffect(() => {
    if (processing.current) return;
    processing.current = true;

    async function process() {
      try {
        const user = await handleCallback();

        // Check if session migration is needed
        const sessionId = localStorage.getItem('sessionId');
        if (sessionId && user?.access_token) {
          try {
            await apiJson('/migrate-session', {
              method: 'POST',
              token: user.access_token,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId }),
            });
            localStorage.removeItem('sessionId');
          } catch {
            // Migration failure is non-critical — keep sessionId for retry
          }
        }

        navigate('/', { replace: true });
      } catch (err) {
        console.error('OIDC callback error:', err);
        navigate('/', { replace: true });
      }
    }

    process();
  }, [handleCallback, navigate]);
}
