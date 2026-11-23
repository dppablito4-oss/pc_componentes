import React from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import Home from './page';
import { GITHUB_PAGES } from './links';
import './globals.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Home />
    {!GITHUB_PAGES && <Analytics />}
  </React.StrictMode>,
);
