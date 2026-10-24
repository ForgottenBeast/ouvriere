# Demo maintenance guide

This page is a static Astro presentation. Keep its content and media references small and
explicit until the CMS feature is designed.

## Public compatibility surface

As of version 4.3.0, the public compatibility surface is the `/ouvriere/` HTML page and its
static media references; generated hashed asset filenames are implementation details and are
not a stable API. There is no public JavaScript module API, CMS API, upload endpoint or stable
content schema. Changes to the page contract should be documented here and versioned with the
release process.

## Sequence to preserve

The page begins with the white `L'Ouvriere` title centered over the sea. The italic quote
`La pleine mer en pleine terre` and `G.Pudlowski` begin 1000 ms after the title starts. All
three intro elements fade out together. Three white, left-justified bullet entries then fade
in individually; the list is display-only and must not acquire links or click behavior as
part of this demo.

The current timeline is title fade-in 0–2000 ms, quote and attribution fade-in 1000–3000 ms,
shared intro fade-out 5000–6190 ms, then three 800 ms menu fades with onsets at 6190 ms,
6815 ms and 7440 ms, completing at 8240 ms. The 1000 ms quote onset and shared fade-out are
fixed for this revision; other durations may be tuned from visual evidence.

## Comparison routes

`/v1/` preserves the current presentation. `/v2/` is a nature comparison: its title entrance
lasts 2500 ms while quote, fade-out, and menu timings stay unchanged. It alternates the existing
sea source with a green-water source through a baked 1500 ms crossfade in one Stream MP4.
Reduced motion, Save-Data, playback failure, and JavaScript-disabled states retain the poster
fallback.

`/versions/` is the base-aware chooser for these non-indexed comparison routes.

`/v3/` uses the same 2500 ms title timing and Cormorant Garamond typography as v2, with an
independent green-water poster and a single green-only looping Stream MP4. It must never fall
back to the ocean poster or video, including with JavaScript disabled, reduced motion, Save-Data,
or media playback failure.

`/v4/` keeps the v3 green-only poster and Stream loop, Cormorant typography, and 2500 ms title
timing while removing background blur from both the static poster/video composition and the
enhanced media animation. Text animation is unchanged.

`/v5/` keeps v4's unblurred composition, Cormorant typography, and 2500 ms title timing with a
separate portrait poster and a single Stream loop derived from media supplied by the project
user. It must use that matching poster for the visible fallback, video poster, and social image;
it must never fall back to either the original ocean or green comparison assets.

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
details.

The final approximately 11-second crossfaded Stream asset is recorded in
[`media-license.md`](media-license.md), including its video ID, complete returned MP4 URL
and served size. The local poster and full static text remain the fallback for preference and
playback failure states. The crossfade is a softened blend and does not guarantee a perfectly
seamless loop.

For a Stream replacement:

1. Confirm the clip license and retain the source URL and license URL in `media-license.md`.
2. Upload the approved file to Cloudflare Stream using the project's authorized workflow.
3. Request a downloadable MP4 using Stream's documented download endpoint, poll until the
   download is ready, and record the exact returned MP4 URL in the static page configuration.
   The returned URL may use `customer-<CODE>.cloudflarestream.com` or
   `videodelivery.net`; a Stream video ID alone is insufficient for the `<video>` source.
   See [Cloudflare's Stream download documentation](https://developers.cloudflare.com/stream/viewing-videos/download-videos/).
4. Keep the poster in the repository and verify the fallback states locally. Record the exact
   returned MP4 URL and its measured delivery response in `media-license.md`.

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

The interim prototype must implement an accessible legal disclosure using the current website
legal text verbatim, including its identifiers, blank fields, AWS host wording and Zenchef
webmaster wording. The exact source snapshot is recorded in the planning research. Publisher
reconciliation and host wording adaptation are deferred, but the verbatim disclosure remains
required before publication.
