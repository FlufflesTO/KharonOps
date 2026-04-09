export function registerPortalServiceWorker(): void {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/portal/sw.js", { scope: "/portal/" }).catch((error) => {
        console.error("Service worker registration failed", error);
      });
    });
  }
}
