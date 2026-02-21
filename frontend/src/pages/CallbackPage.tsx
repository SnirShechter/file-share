import { useOidcCallback } from '../auth/callback.js';

export default function CallbackPage() {
  useOidcCallback();

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-gray-600 text-lg">מתחבר...</p>
      </div>
    </div>
  );
}
