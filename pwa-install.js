// Register service worker and handle beforeinstallprompt to show a custom install UI.
// Include this script near the end of your body or import it from your main bundle.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registered, scope:', reg.scope))
      .catch(err => console.warn('SW registration failed:', err));
  });
}

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  deferredPrompt = e;
  // Dispatch an event or show your install button here
  window.dispatchEvent(new CustomEvent('pwa-install-available'));
});

// Example helper to trigger the prompt from your UI
window.promptPWAInstall = async function promptPWAInstall() {
  if (!deferredPrompt) return null;
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return choice;
};