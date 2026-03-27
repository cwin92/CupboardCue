# CupboardCue

Mobile-first Next.js + Supabase rebuild of the original Adalo app for current menu tracking, a personal library, ingredient-driven shopping lists, and lightweight meal planning.

## Inferred Product Audit

- The original app is a simple five-tab mobile flow with image-led cards, rounded white forms, and soft green branding.
- Home is a "current menu" subset of the user's personal food collection.
- Library is the full user-owned collection with a quick add/remove control for the current menu.
- Item detail is the operational center: recipes, notes, ingredients, shopping state, and quick calendar assignment.
- Shopping list is ingredient-driven, not menu-item-driven.
- Calendar planning is lightweight and should stay easy to use on mobile, including quick entry from the current menu and library.

## Route Structure

- `/login`
- `/signup`
- `/app`
- `/app/library`
- `/app/items/new`
- `/app/items/[id]`
- `/app/items/[id]/edit`
- `/app/items/[id]/ingredients`
- `/app/shopping-list`
- `/app/planner`
- `/app/settings`

## File Structure

```text
app/
  (auth)/
  app/
  globals.css
  layout.tsx
  manifest.ts
components/
  auth/
  items/
  layout/
  planner/
  ui/
lib/
  data/
  supabase/
  types.ts
  utils.ts
supabase/
  schema.sql
```

## Database Schema

Tables:

- `profiles`
- `meal_types`
- `cooking_times`
- `menu_items`
- `ingredients`
- `calendar_entries`

Key data rules:

- Every user-owned record includes `user_id`
- `meal_types` and `cooking_times` support shared defaults via `user_id is null`
- Ingredient shopping state lives on `ingredients.on_shopping_list`
- Calendar entries are separate rows so the same food item can be planned multiple times
- RLS enforces per-user ownership on all user-owned data

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env vars:

```bash
cp .env.example .env.local
```

3. Add your Supabase project URL and anon key to `.env.local`.

4. Run the SQL in [schema.sql](/Users/carolinefisher/Documents/Playground/supabase/schema.sql) inside the Supabase SQL editor.

5. Start the app:

```bash
npm run dev
```

## Supabase Setup

1. Create a new Supabase project.
2. In Auth, enable email/password sign-in.
3. In SQL Editor, run [schema.sql](/Users/carolinefisher/Documents/Playground/supabase/schema.sql).
4. Optional but recommended next: create a `menu-images` storage bucket for real uploads.
5. Copy `Project URL` and `anon public key` into `.env.local` and Vercel env vars.

## Vercel Deployment Steps

1. Push this repo to GitHub.
2. Import the repo into Vercel.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Deploy.
5. After deploy, create a real user account and test the core loop:
   create item -> add ingredients -> toggle shopping -> assign calendar date.

## Assumptions Made

- Screenshots are the primary visual reference, so styling stays intentionally simple and mobile-first rather than fully redesigned.
- The missing calendar screenshots are interpreted as a lightweight weekly/monthly planner consistent with the rest of the app.
- MVP image handling uses `image_url` first so the product works immediately; Supabase Storage can be added next without changing the data model much.
- The Adalo "master list" is treated as each user's personal library, not a global shared catalog.
- Custom meal types and cooking times are supported in the form and settings, but defaults are seeded globally.

## Recommended Next Improvements

- Add Supabase Storage upload for real photo picking and camera capture.
- Add optimistic interactions for toggles and planner assignment.
- Add profile settings and password reset flows.
- Add drag/drop or tap-to-assign planner improvements.
- Add import tooling from existing Adalo exports.
- Add installability polish: offline caching, splash icons, and share-target support.

## Fastest Path To Replace Adalo

1. Stand up Supabase and deploy this app to Vercel.
2. Create a small pilot account and manually recreate a handful of real menu items.
3. Validate the main loop on mobile Safari: auth, library, current menu, shopping list, planner.
4. Import the remainder of the user’s Adalo content through SQL or a small one-off CSV importer.
5. Point users to the new web app and keep Adalo read-only during the transition week.
6. After confidence is high, sunset the Adalo version.

## Recommended iOS Wrap Path With Capacitor

1. Keep the web app as the source of truth.
2. Add real image upload/camera capture with Supabase Storage.
3. Add a service worker and offline caching strategy for recently viewed data.
4. Wrap with Capacitor once the mobile web flow feels stable.
5. Add native plugins only where they materially improve the experience: camera, push notifications, share sheet, and local storage.
