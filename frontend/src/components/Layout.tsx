import type { ReactNode } from 'react';
import Header from './Header.js';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface" dir="rtl">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-border py-4 text-center text-sm text-gray-500">
        <div className="container mx-auto px-4">
          שיתוף קבצים מאובטח &middot; קבצים נמחקים אוטומטית לאחר 7 ימים
        </div>
      </footer>
    </div>
  );
}
