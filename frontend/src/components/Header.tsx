import { useAuth } from '../auth/useAuth.js';

export default function Header() {
  const { isAuthenticated, isLoading, login, logout, user } = useAuth();

  return (
    <header className="bg-white border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary">
          שיתוף קבצים
        </h1>
        <div className="flex items-center gap-4">
          {isLoading ? (
            <span className="text-gray-400 text-sm">טוען...</span>
          ) : isAuthenticated ? (
            <>
              <span className="text-sm text-gray-600">
                {user?.profile?.name || user?.profile?.preferred_username || 'משתמש'}
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                התנתק
              </button>
            </>
          ) : (
            <button
              onClick={login}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors cursor-pointer"
            >
              התחבר
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
