import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Templates from './pages/Templates';
import Register from './pages/Register';
import Stats from './pages/Stats';
import Settings from './pages/Settings';
import BottomNav from './components/BottomNav';
import './styles.css';
import { ToastProvider } from './components/Toast';

function Shell({ element }: { element: React.ReactNode }) {
  return (
    <>
      {element}
      <BottomNav />
    </>
  );
}

const router = createBrowserRouter([
  { path: '/', element: <Shell element={<Templates />} /> },
  { path: '/register', element: <Shell element={<Register />} /> },
  { path: '/stats', element: <Shell element={<Stats />} /> },
  { path: '/settings', element: <Shell element={<Settings />} /> }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  </React.StrictMode>
); 