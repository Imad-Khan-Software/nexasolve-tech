import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { getOrCaptureTrafficSource } from './lib/trafficSource.js';

// Capture (and cache) this visitor's traffic source as early as
// possible, while the utm_source param / referrer from this page load
// is still available — see lib/trafficSource.js. Never throws, never
// blocks render.
getOrCaptureTrafficSource();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
