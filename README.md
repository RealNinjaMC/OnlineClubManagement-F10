# Campfire

Online club management app built for the Session Ending Exam of our Web Development course.

**Live:** https://onlineclubmanagementf10.vercel.app

## Features

- Browse clubs and request to join
- Root, host and member roles
- Events, announcements, polls and club chat, all updating in real time
- Club ratings, a club match page and a stats page
- Mobile layout

## Tech stack

React 18, React Router, Vite, Supabase (auth, Postgres, Realtime) and Vercel.

## Running locally

1. Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql) in its SQL editor.
2. Create `.env.local` in the project root:

   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_KEY=your-anon-key
   ```

3. Install and start:

   ```
   npm install
   npm run dev
   ```

4. Sign up, then make your account the root user in the Supabase SQL editor:

   ```sql
   update public.profiles set role = 'root' where id = 'your-user-id';
   ```

## Deploying

Import the repo into Vercel and add `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY` as environment variables. `vercel.json` already rewrites all routes to `index.html`.
