# Tampa CarpetFest

The attendee app for Tampa CarpetFest. It runs on the web (mobile-first) and can ship to iOS and Android from the same code.

Built with Expo (Expo Router) for the app and Supabase for logins, data, and photo storage.

## What's in it

- **Login and sign-up.** Everything is behind a login. New accounts need the invite code (`carpet27` for 2027), and Supabase itself rejects any sign-up without a valid code.
- **Home.** Welcome message, a nudge to finish your profile, and announcements.
- **Itinerary.** The event schedule, grouped by day.
- **Attendees.** Searchable list of everyone, by name, business, species, or city. Tap anyone to see their profile, with Background, Pet Reptile, and Other Pet tabs plus the CarpetFests they've attended.
- **My Profile.** Edit your own details and photos, and log out.

## One-time Supabase setup

1. **Create the database.** In the Supabase dashboard, open **SQL Editor → New query**. Paste in the contents of `supabase/migrations/0001_init.sql` and click **Run**. Run it only once.
2. **Turn off email confirmation for now.** Go to **Authentication → Sign In / Providers → Email** and switch off **Confirm email**. Supabase's built-in email service only sends to your own team's addresses, so attendees would never get the link. Turn it back on once Resend is connected.
3. **Make the admin account.** Sign up in the app with the admin's email, then run this in the SQL Editor:
   ```sql
   update public.profiles set is_admin = true
   where id = (select id from auth.users where email = 'DAD@EXAMPLE.COM');
   ```
   Admins can add and edit itinerary items and announcements. Until the in-app admin screens exist, use **Table Editor → itinerary_items / announcements** in the dashboard.

## Running it on your computer

You need Node.js 20 or newer.

```bash
npm install
npx expo install --fix   # aligns package versions with the installed Expo SDK
cp .env.example .env
npx expo start
```

Then press `w` to open it in a browser. To try it on a phone, scan the QR code with the **Expo Go** app.

## Common changes

- **Logo:** replace `assets/images/logo.png` (square, transparent background, about 512×512). Replace `assets/images/icon.png` (1024×1024) for the app icon.
- **Colors:** `lib/theme.ts`.
- **Event year and range of years attended:** `lib/constants.ts`.
- **Next year's invite code:** in the SQL Editor:
  ```sql
  update public.invite_codes set active = false where code = 'carpet27';
  insert into public.invite_codes (code) values ('carpet28');
  ```

## Project layout

```
app/                  screens (file names are the routes)
  sign-in.tsx, sign-up.tsx
  (app)/              everything behind the login, with the bottom tab bar
    index.tsx         Home
    itinerary.tsx
    attendees/        list + [id] profile page
    me.tsx            edit my profile
components/           shared UI pieces
lib/                  Supabase client, login state, theme, photo upload
supabase/migrations/  database tables and security rules
```
