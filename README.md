# Stampede

Bump chart of what vibe-coders are shipping. One object. Linger on the lines.

```bash
cp .env.example .env
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run test:match
npm run dev
```

Edit `data/bump.json` (builders per week, labeled ESTIMATE). Ranks are derived on seed: stampede = most builders first, empty = fewest first.

```bash
npm run data:validate
npm run test:rank
npx prisma db push
npm run db:seed
```

Seed upserts clusters/weeks. It does not delete Count-me submissions. This week’s counts are folded into rank (one browser, three per network).

Production: do not seed on every deploy. Point the app at Turso (`TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`), set `COUNT_SECRET`, set `NEXT_PUBLIC_SITE_URL` to the live origin (`https://stampede.codes`). First time: `npx prisma db push` locally, then `turso db create stampede --from-file ./dev.db` (or your sqlite path) and seed once against Turso. Vercel’s filesystem will not keep Count me.

Hover isolates a line. Click opens the panel. Toggle Stampede or Empty. Type what you’re building — match paints that line oxblood.
