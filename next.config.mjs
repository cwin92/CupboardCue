/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**"
      }
    ]
  }

  // CAPACITOR NOTE — static export
  // This app uses Next.js Server Actions and @supabase/ssr (server-side cookie
  // auth), so `output: 'export'` is intentionally NOT enabled here.  The iOS
  // build loads the deployed app via capacitor.config.ts `server.url`.
  //
  // If you later migrate all data-fetching to the Supabase browser client and
  // remove server actions, enable static export by adding:
  //   output: 'export',
  //   trailingSlash: true,
  // and removing `server.url` from capacitor.config.ts.
};

export default nextConfig;
