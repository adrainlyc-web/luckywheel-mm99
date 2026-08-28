# Lucky Wheel

A customer bonus-claim wheel: you send customers a link, they enter their phone
number, spin, and claim a prize — once. You control who's eligible via an
admin dashboard that shows who has claimed and who hasn't.

## How it works

- **`index.html`** — the customer-facing page. They type their phone number
  and press "Spin to Claim."
  - If the phone number is **not on your list** → "not eligible" message, no spin.
  - If it's on the list and **hasn't claimed yet** → the server picks a prize
    (weighted random, based on whatever you've set in the admin's Prize
    Settings panel) and the wheel spins to show it. That phone number is now locked.
  - If it's on the list and **already claimed** → shows their same prize again
    (no new spin), so they can't claim twice.
- **`admin.html`** — password-protected dashboard where you:
  - Set each prize's name, color, and win rate (Prize Settings panel).
  - Paste in the list of eligible customers (name + phone).
  - See a live table of who's claimed vs. still pending, with counts at the top.
- The prize decision always happens on the server (`api/claim.js`), never in
  the browser, so it can't be manipulated by editing the page.

## One-time setup

### 1. Put this project on GitHub
1. Go to [github.com/new](https://github.com/new), create a new **empty**
   repository (no README/gitignore), e.g. `lucky-wheel`.
2. Tell me the repo URL and I'll commit + push this code to it (you'll need
   to generate a GitHub personal access token for the push — I'll walk you
   through that when we get there).

### 2. Deploy on Vercel
1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repo
   you just created.
2. Leave the build settings as detected (no framework) and click **Deploy**.

### 3. Add a database
1. In your new Vercel project, open the **Storage** tab.
2. Add a **Postgres** database (Vercel's own integration, currently backed
   by Neon — free tier is enough for this).
3. Once created, Vercel automatically connects it to your project and sets
   the `POSTGRES_URL` environment variable for you. Nothing to copy/paste.
4. The very first API call the app makes will automatically create the
   database table it needs — you don't need to run any SQL yourself.

### 4. Set your admin password
1. In the Vercel project, go to **Settings → Environment Variables**.
2. Add a variable named `ADMIN_PASSWORD` with whatever password you want to
   use to log into `/admin.html`.
3. Redeploy (Vercel → Deployments → click the ⋯ menu on the latest
   deployment → Redeploy) so the new variable takes effect.

### 5. Try it
- Customer page: `https://your-project.vercel.app/`
- Admin page: `https://your-project.vercel.app/admin.html`
  1. Log in with the `ADMIN_PASSWORD` you set.
  2. Paste customers into the "Add Eligible Customers" box, one per line:
     `Name, Phone` (or just `Phone` with no name).
  3. Click **Add to List**.
  4. Share the customer page link with them. Refresh the admin table anytime
     to see who's spun.

## Customizing prizes

Open `/admin.html` and use the **Prize Settings** panel — set each prize's
name, wheel color, and win weight (higher weight = more likely to be won;
the live "Chance" column shows the resulting percentage), then click
**Save Prize Settings**. Add or remove prizes with the +/✕ buttons. Changes
take effect immediately for the next spin — no redeploy needed.

`config/prizes.js` is only used once, the very first time the app runs, to
fill in starting defaults. After that it's never read again — all prize data
lives in the database.

## Notes

- Each **phone number** can claim once, ever. Phone numbers are matched
  after stripping spaces/dashes, so `712 345 67`, `712-345-67`, and
  `71234567` are treated as the same number.
- Adding a phone number that's already on the list is safe — it won't
  overwrite an existing claim.
- The admin password travels with each admin request but the page itself is
  only as private as its URL + password — don't post the admin link publicly.
