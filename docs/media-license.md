# Prototype media provenance

## Calm sea waves prototype asset

This stock video is the current prototype asset. Replace it when the restaurant's chef
footage is available.

- Title: *Calm Ocean Waves and Cloudy Sky Horizon Scenery*
- Creator: Marianna Sigov
- Pexels clip ID: `30608661`
- Source: <https://www.pexels.com/video/calm-ocean-waves-and-cloudy-sky-horizon-scenery-30608661/>
- License: Pexels License, <https://www.pexels.com/license/>
- License checked: 2026-10-21
- Suggested credit: `Video by Marianna Sigov via Pexels`

The source is licensed under the Pexels License; it is not CC0 or public-domain
media. The license permits free website use and modification and does not
require attribution. It prohibits redistribution as stock media and other uses
listed on the license page.

The original download is 1920 x 1080 at 29.97 fps with a 27-second duration.
It is stored outside Git at
`/tmp/ouvriere-media/pexels-30608661-source.mp4`.

The first prepared upload candidate is stored outside Git at
`/tmp/ouvriere-media/pexels-30608661-loop-12s-optimized.mp4`. It uses seconds
5 through 17 of the source, removes audio, and encodes H.264 at 1920 x 1080,
29.97 fps, `yuv420p`, x264 slow preset, CRF 27, with fast-start metadata. Its
measured duration is 12.012 seconds and its measured size is 4,241,980 bytes
(about 4.05 MiB).

The first and final frames were inspected. The horizon remains stable, but the
cloud and water motion differ across the cut. This derivative is suitable for
repeated playback but is not a seamless loop; no crossfade was applied.

The final crossfaded upload candidate is stored outside Git at
`/tmp/ouvriere-media/pexels-30608661-loop-11s-crossfade.mp4`. It is an approximately
11-second H.264 derivative made from the same source cut with a 1-second crossfade and
rotation. Its measured size is 7,767,392 bytes. The blend softens the transition but does
not guarantee a perfectly seamless loop.

The poster at `src/assets/media/calm-sea-waves-poster.jpg` was extracted at
9 seconds from the original source, scaled to 1280 x 720 with Lanczos scaling,
and encoded as JPEG. Its measured size is 89,825 bytes.

## Cloudflare Stream delivery

The final crossfaded Stream asset uses video ID `9741a9cf044d648f924291e94598083c`. Its
downloadable MP4 URL is:

<https://customer-spsh21dx72idjxm3.cloudflarestream.com/9741a9cf044d648f924291e94598083c/downloads/default.mp4>

On 2026-10-22, the URL returned HTTP 200 with `Content-Type: video/mp4` and a served size of
5,430,971 bytes. The delivered duration is 11.04 seconds. The crossfade is a softened blend,
not a guarantee of a perfectly seamless loop. No claim of public deployment is made by this
record.
