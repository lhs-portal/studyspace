/**
 * Studyspace - Cache Reset Module (cache-reset.js)
 * Force purges browser service worker caches and session state
 */

async function forceClearCacheAndRefresh() {
  const btn = document.getElementById("forceRefreshBtn");
  if (btn) {
    btn.disabled = true;
    btn.innerText = "Clearing Cache...";
  }

  try {
    // 1. Delete all Service Worker cache storage buckets
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));
    }

    // 2. Unregister active service workers to force total re-installation
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        await registration.unregister();
      }
    }

    // 3. Purge cached local storage while preserving active user authentication session
    const sessionBackup = localStorage.getItem("lhs_user_session");
    localStorage.clear();
    if (sessionBackup) {
      localStorage.setItem("lhs_user_session", sessionBackup);
    }

    console.log("[App] All caches cleared successfully. Hard reloading...");

    // 4. Force hard reload bypassing browser cache
    window.location.reload(true);

  } catch (err) {
    console.error("Cache clear failed:", err);
    window.location.reload();
  }
}

// Make globally accessible
window.forceClearCacheAndRefresh = forceClearCacheAndRefresh;
