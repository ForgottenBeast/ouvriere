# Demo maintenance guide

This page is a static Astro presentation. Keep its content and media references small and
explicit until the CMS feature is designed.

## Public compatibility surface

The unreleased prototype public surface is the `/ouvriere/` HTML page and its static media
references; generated hashed asset filenames are implementation details and are not a stable
API. The existing manifest version remains in force until a separate approved release commit
assigns the prototype version. There is no public JavaScript module API, CMS API, upload
endpoint or stable content schema. Changes to the page contract should be documented here and
versioned with the release process.

## Sequence to preserve

The page begins with the white `L'Ouvriere` title centered over the sea. The italic quote
`La pleine mer en pleine terre` and `G.Pudlowski` begin 500 ms after the title starts. All
three intro elements fade out together. A white, left-justified bullet list then fades in;
the list is display-only and must not acquire links or click behavior as part of this demo.

The provisional timeline is title fade-in 0–1000 ms, quote fade-in 500–1500 ms, title hold
through 2500 ms, shared intro fade-out 2500–3200 ms, and list fade-in 3200–4100 ms. The
500 ms quote onset and shared fade-out are fixed; other durations may be tuned from visual
evidence.

The video or poster background gets a slight blur when text starts appearing. Tune the blur
and contrast scrim from Chrome DevTools captures so the white text remains legible while the
background still reads as sea footage. Keep the blur clipped to the viewport so it cannot
create an edge around the background.

The static HTML must retain the title, quote, attribution and list when JavaScript is
disabled. Reduced motion and detectable Save-Data should show the poster composition without
loading the Stream source. Failed autoplay or an unavailable Stream reference must leave the
poster and text usable. Any playback and intro-skip controls need keyboard access and visible
focus.

## Media replacement

The current poster is `src/assets/media/calm-sea-waves-poster.jpg`. The source clip and its
optimized upload candidate live outside the repository under `/tmp/ouvriere-media/`; see
[`media-license.md`](media-license.md) for the exact paths, source URL, license and encoding
details. Do not commit raw video or credentials.

The current Stream playback reference is intentionally empty until the authorized upload
returns a ready downloadable MP4 URL. The local poster and full static text remain the
verified fallback while that integration is blocked.

For a Stream replacement:

1. Confirm the clip license and retain the source URL and license URL in `media-license.md`.
2. Upload the approved file to the project's Cloudflare Stream account using an authorized
   operator workflow. Keep the upload credential in the configured secret store; do not add
   it to shell history, source files or this guide.
3. Request a downloadable MP4 using Stream's documented download endpoint, poll until the
   download is ready, and record the exact returned MP4 URL in the static page configuration.
   The returned URL may use `customer-<CODE>.cloudflarestream.com` or
   `videodelivery.net`; a Stream video ID alone is insufficient for the `<video>` source.
   See [Cloudflare's Stream download documentation](https://developers.cloudflare.com/stream/viewing-videos/download-videos/).
4. Keep the poster in the repository and verify the fallback states locally. Until a real
   returned MP4 URL is configured, the Stream source is an explicit integration blocker.

The prototype does not provide a browser upload form. Chef media replacement is the core of
the later CMS feature and requires its own storage, permissions and publishing design.

## Image build dependency

Astro 4.2.1 transforms the poster through a runtime `sharp` import. `sharp` 0.32.6 is
therefore declared directly at the exact version already locked under Astro, so the Nix build
can resolve the same image transformer instead of relying on an incidental hoist. Remove this
declaration only when `npm ci && nix build .#` succeeds after Astro no longer transforms the
poster through `sharp`.

## Hosting and publication

Build with `nix build .#` or the commands in the repository README. GitHub Pages publishes
the Nix result at `/ouvriere/`; check the generated paths after every Astro configuration
change. Keep `noindex, nofollow` metadata until an explicit production migration.

Legal publication remains blocked until the editor/operator, publication director, public
contact and final host wording are confirmed. The current website's AWS and Zenchef entries
describe the prior setup and must not be copied into the prototype without verification.
