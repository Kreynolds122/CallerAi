# Review Attached Prompt

This is a code bundle for Review Attached Prompt. The original project is available at https://www.figma.com/design/8C0GMUJ7PM6PlBZRcKmdDB/Review-Attached-Prompt.

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Deploying to Vercel

- Import the GitHub repo into Vercel.
- Keep the build command as `npm run build` and the output directory as `dist`.
- No environment variables are required for the current frontend build.
- The app already includes an SPA rewrite in `vercel.json`, so refreshes on client-side routes will work.

If you later move the Supabase project ID or anon key out of `utils/supabase/info.tsx`, add them as Vercel environment variables and read them from `import.meta.env`.
