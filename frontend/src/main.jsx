import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#171A21',
            color: '#F5F6F8',
            border: '1px solid #262B35',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#2FD675', secondary: '#0F1115' } },
          error: { iconTheme: { primary: '#FF5C5C', secondary: '#0F1115' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
