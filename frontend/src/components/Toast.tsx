import { Toaster } from 'react-hot-toast';

export default function Toast() {
  return (
    <Toaster
      position="bottom-left"
      toastOptions={{
        duration: 4000,
        style: {
          direction: 'rtl',
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '14px',
        },
        success: {
          style: {
            background: '#f0fdf4',
            color: '#166534',
            border: '1px solid #bbf7d0',
          },
        },
        error: {
          style: {
            background: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
          },
        },
      }}
    />
  );
}
