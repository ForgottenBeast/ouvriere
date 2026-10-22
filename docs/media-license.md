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

The prepared upload candidate is stored outside Git at
`/tmp/ouvriere-media/pexels-30608661-loop-12s-optimized.mp4`. It uses seconds
5 through 17 of the source, removes audio, and encodes H.264 at 1920 x 1080,
29.97 fps, `yuv420p`, x264 slow preset, CRF 27, with fast-start metadata. Its
measured duration is 12.012 seconds and its measured size is 4,241,980 bytes
(about 4.05 MiB).

The first and final frames were inspected. The horizon remains stable, but the
cloud and water motion differ across the cut. This derivative is suitable for
repeated playback but is not a seamless loop; no crossfade was applied.

The poster at `src/assets/media/calm-sea-waves-poster.jpg` was extracted at
9 seconds from the original source, scaled to 1280 x 720 with Lanczos scaling,
and encoded as JPEG. Its measured size is 89,825 bytes.

## Cloudflare Stream delivery

The prepared upload is available through Cloudflare Stream with video ID
`dfdd8aa3018f15b13f2a75ec8ad1deae`. The configured downloadable MP4 URL is:

<https://customer-spsh21dx72idjxm3.cloudflarestream.com/dfdd8aa3018f15b13f2a75ec8ad1deae/downloads/default.mp4>

On 2026-10-22, the URL returned HTTP 200 with `Content-Type: video/mp4` and a served
`Content-Length` of 5,690,651 bytes. This served size is distinct from the 4,241,980-byte
(about 4.05 MiB) prepared upload candidate described above. The delivery asset duration is
12.01 seconds. No claim of public deployment is made by this record.
