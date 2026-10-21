# L'Ouvrière — Website Brief

> Working brief for building the site with Claude Code. Read fully before starting any task.

## 1. Context

- Client: a chef. Cuisine centred on **seafood, fish and vegetables**.
- Goal of the site: convey his **culinary universe**, not list a menu.
- Engagement: **single-page prototype, pro bono**, hosted on a subdomain of Mallet Stratégie et Sécurité. Purpose: let the chef decide whether to work together.
- The chef is the **artistic lead**. He will draw, shoot photos/videos and populate content himself through the CMS.
- Phase 1: I (Quentin) build the skeleton and deploy it, with only my own CMS account. I demo it to the chef in person.
- Phase 2: chef gets his own CMS account and populates content.
- Phase 3 (if he signs): migrate to his own domain/accounts, possibly split into a few pages.

## 2. Product requirements

- **Media-heavy, minimal text, unobtrusive.** Background videos, full-bleed images, smooth transitions.
- **Responsive**, mobile included (vertical video crops — see §6).
- **Small number of pages.** Prototype = one page with sections.
- **Updated ~4×/year minimum**: seasonal changes, special offers.
- Practical info (address, hours, booking) must stay **one tap away** everywhere, visually discreet.

## 3. Stack (decided)

| Concern | Choice |
|---|---|
| Framework | **Astro**, static output only (no SSR, no adapter) |
| CMS | **Pages CMS** (hosted app.pagescms.org for now), repo already linked |
| Hosting | **Cloudflare** (Pages or Workers static assets), Git-connected auto-deploy |
| Photos | In the repo, uploaded via Pages CMS, optimised at build by Astro's image pipeline (AVIF/WebP, responsive `srcset`) |
| Video | **Cloudflare Stream**, referenced by video ID in content. **Never in git.** |
| Analytics | Cloudflare Web Analytics (cookieless) — or none |
| Transitions | Native View Transitions as progressive enhancement, plain CSS fade fallback |

### Explicitly rejected
- **Git LFS**: git-based CMSes commit via the GitHub API (plain blobs), LFS adds build friction and quotas. Not used.
- **Raw video in repo**: nothing transcodes it; repo bloat.
- **YouTube/Vimeo embeds, Google Maps embeds, third-party fonts from Google CDN at runtime**: trackers → consent banner. Self-host fonts.
- TinaCMS, Keystatic (needs SSR), Sveltia (beta, no custom widgets yet). Decap = fallback if Pages CMS blocks us.

## 4. Page structure (prototype: one page)

1. **Accueil** — full-bleed seasonal hero video, one line of text, discreet booking button.
2. **L'Univers** — three scroll sections: **Mer / Poisson / Potager**, each image- or video-led, minimal text.
3. **La Maison** — the place, team, address, hours, booking link.
4. **Offre du moment** — optional overlay/section, shown only when an offer is active.
5. **Mentions légales** — separate minimal page (mandatory in France).

Section anchors should map cleanly to future routes (`/`, `/univers`, `/maison`) so splitting later doesn't change the content model.

## 5. Content model

All content in Astro content collections, schemas validated with Zod (`image()` helper for images) so a bad entry **fails the build**, not the page.

```
src/content/
  seasons/            # one file per season, e.g. automne-2026.md
  offers/             # one file per offer
  sections/           # mer.md, poisson.md, potager.md (L'Univers)
  site.yaml           # singleton: name, address, hours, booking URL, socials, legal info
src/assets/media/     # CMS photo uploads land here (so Astro can optimise them)
```

### `seasons/*`
- `title` (string), `active` (boolean — exactly one active; build should fail otherwise)
- `tagline` (short string, max ~120 chars)
- `hero_video_landscape` (Stream ID, string), `hero_video_portrait` (Stream ID, string)
- `hero_poster` (image, required — LCP element and fallback)
- `gallery` (list of images, ~4)

### `offers/*`
- `title`, `text` (short), `image`, `start_date`, `end_date`
- Visibility filtered **at build time** by date. A daily Cloudflare cron hitting a deploy hook rebuilds the site so offers appear/disappear on schedule (phase 2, not needed for demo).

### `sections/*` (Mer / Poisson / Potager)
- `title`, `line` (one sentence), `media` (image), optional `video_landscape` / `video_portrait` (Stream IDs), `order`

### `site.yaml`
- `name`, `address`, `geo` (lat/lng for JSON-LD), `hours` (structured), `booking_url`, `phone`, `email`, `socials`, legal fields for mentions légales (publisher, host, SIRET…)

## 6. Media rules

### Video
- Hosted on **Cloudflare Stream**, **MP4 downloads enabled** so we can use a plain `<video>` element (no hls.js).
- Markup: `<video autoplay muted loop playsinline preload="metadata" poster="…">`, with `<source media="(orientation: portrait)">` for the vertical crop.
- Respect `prefers-reduced-motion` and `Save-Data` → show poster only.
- Loops 8–20 s, no sound, target ~2–5 MB.
- **Workflow for now:** chef sends clips, Quentin uploads to Stream and sets the ID. The chef never uses the Cloudflare dashboard.
- **Later (optional):** custom Pages CMS field + small Worker issuing Stream direct-creator-upload URLs → chef uploads video in the CMS like a photo.
- For the skeleton: Stream IDs can be empty → component renders poster only. Use placeholder clips if available.

### Photos
- Fixed aspect ratios: **3:2, 4:5, 1:1** (+ 16:9 / 9:16 posters).
- Always `width`/`height` via Astro `<Image>`/`<Picture>` → no layout shift.
- Meaningful `alt` text required in the schema (not optional).

### Placeholders
- Skeleton uses neutral placeholders at the **exact** target aspect ratios so layout is final before real content arrives.

## 7. Pages CMS setup

- Config in `.pages.yml` at repo root: content entries for `seasons`, `offers`, `sections` (collections) and `site.yaml` (file), media folder `src/assets/media`.
- Editor-facing labels **in French** (the chef's language), short hints on each field (aspect ratio, max length).
- Hide anything technical from the chef (Stream IDs can be in a collapsed/secondary group, or edited by Quentin only).
- Phase 2: chef added as an **email-invited collaborator** (no GitHub account needed). Collaborators can edit content/media but not `.pages.yml` or other collaborators.

### To verify early (spike before building UI)
1. **Media path resolution**: confirm the paths Pages CMS writes into frontmatter (media `input`/`output` settings) resolve with Astro's `image()` schema helper. Adjust `output` or folder layout until a CMS-uploaded image builds and optimises correctly.
2. **Image lists**: confirm a season's `gallery` (list of images) models cleanly in `.pages.yml`. If not workable → fallback: fixed fields `photo_1..photo_4`, or switch to Decap.
3. **CMS UI language**: check if French UI is available; if not, French field labels/hints are enough.

## 8. Deployment & security

- Cloudflare project connected to the GitHub repo, production branch `main`, build `astro build`, output `dist/`.
- Custom domain: subdomain of Quentin's company.
- **Prototype must not be indexed**:
  - `_headers`: `X-Robots-Tag: noindex, nofollow` on `/*`
  - `robots.txt`: `Disallow: /`
  - Remove both at production migration.
- `_headers` security baseline: strict **CSP** (self + Stream/videodelivery domains + Cloudflare analytics beacon only), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` locking down unused features, `frame-ancestors 'none'`.
- No hardcoded domain anywhere: only Astro `site` config + `site.yaml` → migration = repo transfer + DNS.
- Optional: preview deployments on a `draft` branch for the chef to review before publishing.

## 9. SEO & compliance (even with minimal text)

- `Restaurant` **JSON-LD** from `site.yaml`: address, geo, hours, `servesCuisine`, booking URL (`acceptsReservations`).
- Per-page `<title>`, meta description, Open Graph image (seasonal poster).
- `lang="fr"`.
- Map: static image linking to a map provider, not an embed.
- No cookies → no consent banner. Keep it that way.
- Mentions légales page generated from `site.yaml`.

## 10. Accessibility & performance targets

- LCP element = hero poster, preloaded; video starts after.
- Lighthouse ≥ 90 mobile on performance and accessibility with real content.
- Keyboard-navigable, visible focus, sufficient contrast on text over media (scrim/gradient).
- Near-zero client JS; any JS is progressive enhancement.
- `prefers-reduced-motion`: disable autoplay and transitions.

## 11. Content brief for the chef (to hand over at demo)

- **Video**: shoot so both 16:9 and 9:16 crops work (or shoot both). Stable, slow movement, clean loop, no reliance on sound. 8–20 s. He can trim, mute and export both formats in **Canva**.
- **Photos**: ratios 3:2, 4:5, 1:1; subject centred enough to survive cropping.
- **Per season**: 1 hero video (both crops) + 1 poster image + ~4 photos + 1 line of text.
- Send videos to Quentin; upload photos directly in the CMS.

## 12. Ownership & engagement (non-code, reminder)

- Prototype repo and accounts owned by Quentin for now.
- Short email agreement: chef's photos/videos remain his; handover or deletion on request if the collaboration doesn't continue.
- At signature: domain, Cloudflare account and repo in the restaurant's name, Quentin as member.

## 13. Task list for Claude Code

1. Inspect the initialised Astro repo; set static output, `site` config, `lang="fr"`, base layout, self-hosted fonts.
2. Define content collections + Zod schemas (§5). Seed one season, three sections, `site.yaml` with placeholder data.
3. Write `.pages.yml` (§7) with French labels/hints; run the three spikes in §7 and report findings before continuing.
4. Build components: `HeroVideo` (Stream ID → `<video>` with orientation sources, poster fallback, reduced-motion/save-data handling), `Section`, `Gallery`, `OfferBanner`, `InfoBar` (address/hours/booking, always reachable).
5. Assemble the single page (§4) + mentions légales page.
6. Add View Transitions (progressive) and scroll reveal (CSS-first, reduced-motion aware).
7. Add `_headers` (noindex + security baseline) and `robots.txt` (§8).
8. Add JSON-LD, meta tags, OG image (§9).
9. Build-time guards: exactly one active season; offers filtered by date; required alt text.
10. Verify: `astro build` clean, no layout shift, Lighthouse mobile pass, CSP doesn't block Stream or analytics, test a CMS edit end-to-end (edit in Pages CMS → commit → Cloudflare deploy → visible change).

## 14. Conventions

- Content, labels and UI copy in **French**; code, comments and commit messages in English.
- Keep dependencies minimal; justify any new one.
- Don't introduce SSR, a database, or client-side frameworks without asking.
