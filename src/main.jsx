import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Clear stale service workers + caches that can serve OLD Vite JS chunks and
// trigger "Cannot read properties of null (reading 'useState')" (mismatched React copies).
if ('serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller;
  const clearCaches = () => {
    if (window.caches) caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
  };
  navigator.serviceWorker.getRegistrations()
    .then((regs) => Promise.all(regs.map((reg) => reg.unregister())))
    .then(clearCaches)
    .then(() => {
      // A service worker was actively controlling THIS load (serving stale chunks).
      // Reload once so the page renders without any SW intercepting requests.
      if (hadController && !sessionStorage.getItem('sw-cleared')) {
        sessionStorage.setItem('sw-cleared', '1');
        window.location.reload();
      }
    })
    .catch(clearCaches);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)