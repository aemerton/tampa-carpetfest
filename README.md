# Tampa CarpetFest

The attendee app for Tampa CarpetFest. It runs on the web (mobile-first) and can ship to iOS and Android from the same code.

Built with Expo (Expo Router) for the app and Supabase for logins, data, and photo storage.

## How events work

- One event is **active** at a time, such as "Tampa CarpetFest 2027". Each event has its own **code**, **attendee list**, **itinerary**, and **announcements**.
- **Open registration** switch:
  - **On:** new people can create an account with the event's code, and existing users see "now accepting registrations" on Home and register with the code. Either way they land on that event's attendee list.
  - **Off:** no one new can join.
- **No active event:** no one can create an account, and Home says news on the next event is coming soon.
- **Closing an event:** everyone still on its attendee list gets a badge for it on their profile. Past events and their attendee lists stay viewable under **Previous events**.
- **Tampa CarpetFest 2026:** this happened before the app, so people answer "Did you attend?" on their profile to get its badge.

## What's in it

- **Home.** Shows the active event and its announcements if you're registered, a Register card if registration is open, or "coming soon". There's also a **Previous events** button.
- **Itinerary.** The active event's schedule, grouped by day.
- **Attendees.** The active event's attendee list, searchable by name, business, species, or city. With no active event, it shows the past events you attended instead. Tap anyone to see their profile, tabs, and event badges.
- **My Profile.** Edit your details and photos, answer "Did you attend 2026?", and log out.
- **Admin tools.**
  - **Manage Event tab:** create an event (then set up its itinerary), edit the name, code, or registration, manage the itinerary and announcements, remove people from the attendee list, close or reopen events, and change the app logo.
  - **Manage button:** on any attendee's profile, lets an admin fix or remove anything on it.

## Supabase setup

1. **Database.** In the Supabase dashboard, open **SQL Editor → New query**. Paste in each file from `supabase/migrations/`, in number order, and click **Run**. Run each file only once. When a new numbered file shows up after a `git pull`, run just that one.
2. **Email confirmation (for now).** Go to **Authentication → Sign In / Providers → Email** and switch off **Confirm email**. Supabase's built-in email only sends to your own team's addresses, so attendees would never get the link. Turn it back on once Resend is connected.
3. **Admins.** After someone has an account, run this in the SQL Editor:
   ```sql
   update public.profiles set is_admin = true
   where id = (select id from auth.users where email = 'PERSON@EXAMPLE.COM');
   ```
   They'll see the Manage Event tab the next time they open the app.

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

- **Logo:** admins can upload a new logo in the app under **Manage Event → App settings**. It shows everywhere, including the login screen. `assets/images/logo.png` is the built-in fallback, and `assets/images/icon.png` (1024×1024) is the home-screen app icon, which needs a code change.
- **Colors:** `lib/theme.ts`.
- **Event names, codes, and registration:** in the app, under **Manage Event**.

## Project layout

```
app/                       screens (file names are the routes)
  sign-in.tsx, sign-up.tsx
  (app)/                   everything behind the login
    (tabs)/                the bottom tab bar
      index.tsx            Home
      itinerary.tsx
      attendees/           active list, previous events, past event lists, profile page
      me.tsx               edit my profile
      manage/              Manage Event (admins only)
    register.tsx           register for the active event with its code
    event-editor.tsx       add/edit an itinerary item
    announcement-editor.tsx
    manage-profile.tsx     admin editing someone's profile
components/                shared UI pieces
lib/                       Supabase client, login state, events, theme, photo upload
supabase/migrations/       database tables and security rules
```
