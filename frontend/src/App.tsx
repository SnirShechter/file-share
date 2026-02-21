import { BrowserRouter, Routes, Route } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthProvider.js';
import Layout from './components/Layout.js';
import Toast from './components/Toast.js';
import HomePage from './pages/HomePage.js';
import CallbackPage from './pages/CallbackPage.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/callback" element={<CallbackPage />} />
            </Routes>
          </Layout>
          <Toast />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
