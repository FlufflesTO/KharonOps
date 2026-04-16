export function registerPortalServiceWorker() {
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("/portal/sw.js?v=5", { scope: "/portal/", updateViaCache: "none" }).catch((error) => {
                console.error("Service worker registration failed", error);
            });
        });
    }
}
