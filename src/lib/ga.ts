export function trackEvent(action: string, eventParams?: any) {
  if (import.meta.env.VITE_GA_ID) {
    window.gtag('event', action, eventParams);
  }
}
