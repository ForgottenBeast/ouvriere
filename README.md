# L'Ouvriere landing page demo

This repository contains the static landing page prototype for L'Ouvriere. The first
deployment target is GitHub Pages at
`https://forgottenbeast.github.io/ouvriere/`. The page is a single fullscreen composition:
sea footage, the white `L'Ouvriere` title, the delayed italic quote
`La pleine mer en pleine terre` with `G.Pudlowski`, then a display-only white bullet list.

The prototype has no CMS, chef login, upload workflow, menu destinations, seasons, or
restaurant sections. Those belong to the follow-up CMS feature. The video is intended to be
served by Cloudflare Stream; the local poster remains the fallback and is built as a normal
Astro asset.

## Local development

Use the Nix development shell for the pinned Node.js toolchain:

```sh
nix develop
npm ci
npm run dev
```

Open the local URL printed by Astro. The static build and checks are:

```sh
npm run lint
npm run format:check
nix build .#
npm test
nix build .#doc
```

The Nix package copies the generated `dist/` directory into the build result. GitHub
Actions runs the same `nix build .#` command and publishes that result with GitHub Pages.
The guide-only documentation source is under `docs/src/`; `nix build .#doc` produces the
mdBook site.

The build uses Astro's normal output path. Jampack has been removed so local and CI builds
use the same Astro output. Sharp remains a direct locked resolution while the current
dependency tree requires it; remove that declaration when a clean `npm ci` and `nix build`
succeed without it because upstream dependency resolution makes the transformer available.

## Media and visual contract

The source video stays outside Git. The current approved clip is delivered by Cloudflare
Stream; its complete returned MP4 playback URL and measured response are recorded in
[`docs/media-license.md`](docs/media-license.md). Keep the local poster available for
no-JavaScript, reduced-motion, Save-Data, failed-autoplay and missing-video states.

When the title starts appearing, the background receives a subtle blur while the text stays
sharp. The quote and attribution start 500 ms after the title. The title, quote and
attribution share one fade-out. The left-aligned bullet list appears after that transition
and remains ordinary, noninteractive text. The exact 500 ms offset and shared fade-out are
fixed; other durations may be tuned from Chrome DevTools screenshots.

Stock footage provenance and the prepared upload candidate are recorded in
[`docs/media-license.md`](docs/media-license.md). The current source is a Pexels clip by
Marianna Sigov, not public-domain media. Retain its license evidence when replacing it with
approved chef footage.

## Deployment

`astro.config.ts` sets the site origin and `/ouvriere` base. Every generated URL and asset
reference must work below that base. The workflow in `.github/workflows/deploy.yml` deploys
only pushes to `main`; it requires GitHub Pages to be enabled for the repository.

The prototype must emit `noindex, nofollow` metadata on every generated HTML page. This is
an indexing directive and does not guarantee crawler behavior. A custom domain and Cloudflare
Pages deployment are later steps; the initial demo remains on the GitHub Pages URL.

The interim prototype must implement an accessible legal disclosure using the current website
legal text verbatim, including its identifiers, blank fields, AWS host wording and Zenchef
webmaster wording. The exact snapshot is recorded in the planning research. Publisher
reconciliation and host wording adaptation are deferred, but the verbatim disclosure remains
required before publication.
