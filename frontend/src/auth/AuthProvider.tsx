import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { UserManager, WebStorageStateStore, type User } from 'oidc-client-ts';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  handleCallback: () => Promise<User | null>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const userManager = new UserManager({
  authority: import.meta.env.VITE_OIDC_ISSUER || 'https://auth.snir.sh/application/o/file-share/',
  client_id: import.meta.env.VITE_OIDC_CLIENT_ID || 'file-share',
  redirect_uri: `${window.location.origin}/callback`,
  post_logout_redirect_uri: window.location.origin,
  response_type: 'code',
  scope: 'openid profile email',
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
  automaticSilentRenew: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    userManager.getUser().then((u) => {
      if (u && !u.expired) {
        setUser(u);
      }
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });

    userManager.events.addUserLoaded((u) => setUser(u));
    userManager.events.addUserUnloaded(() => setUser(null));
    userManager.events.addSilentRenewError(() => setUser(null));
  }, []);

  const login = useCallback(async () => {
    await userManager.signinRedirect();
  }, []);

  const logout = useCallback(async () => {
    await userManager.signoutRedirect();
  }, []);

  const handleCallback = useCallback(async () => {
    const u = await userManager.signinRedirectCallback();
    setUser(u);
    return u;
  }, []);

  const token = user?.access_token || null;
  const isAuthenticated = !!user && !user.expired;

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isLoading, token, login, logout, handleCallback }}
    >
      {children}
    </AuthContext.Provider>
  );
}
