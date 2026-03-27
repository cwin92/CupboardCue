import type { CapacitorConfig } from "@capacitor/cli";

// PACKAGING APPROACH: server URL (hosted SSR)
//
// This app uses Next.js Server Actions, Server Components, and @supabase/ssr
// cookie-based auth — none of which survive a static export without a full
// data-layer refactor. The correct minimal-change approach is:
//
//   1. Deploy the Next.js app (e.g. Vercel)
//   2. Set server.url below to your production HTTPS URL
//   3. The iOS WKWebView loads your live app — all SSR, auth, and Server
//      Actions continue to work exactly as they do on the web
//
// For local development (iOS Simulator):
//   • Run `next dev` on your Mac
//   • Set server.url to http://<your-mac-LAN-ip>:3000  (not localhost —
//     the simulator is a separate process and cannot reach 127.0.0.1)
//   • Or use:  npx cap run ios --livereload --external
//     which injects the dev URL automatically
//
// For static-bundle distribution (future):
//   • Convert Server Actions → Supabase browser-client calls
//   • Convert Server Components → client components
//   • Enable `output: 'export'` in next.config.mjs
//   • Remove server.url below so Capacitor reads from webDir: 'out'

const config: CapacitorConfig = {
  appId: "com.cupboardcue.app",
  appName: "CupboardCue",

  // webDir is the target for a future static export build (`next build` with
  // output: 'export' writes to `out/`). Unused while server.url is set.
  webDir: "out",

  server: {
    // ── Set this to your deployed production URL before building for TestFlight ──
    url: "https://cupboardcue.vercel.app",
    // Allow the WebView to follow navigations to Supabase auth endpoints
    allowNavigation: ["*.supabase.co"],
    // Capacitor 6+ defaults: keep cleartext off for App Store compliance
    cleartext: false
  },

  ios: {
    // Respect iPhone notch / Dynamic Island / home-indicator safe areas.
    // The app's CSS already uses env(safe-area-inset-*) so this just ensures
    // the WebView reports correct inset values.
    contentInset: "always",
    // The app manages its own scroll; disabling native WebView scroll avoids
    // double-scroll on iOS.
    scrollEnabled: true
  }
};

export default config;
