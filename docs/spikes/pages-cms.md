# Pages CMS integration spike

Status: design spike for the deferred CMS phase. This document records the smallest useful
content model and the boundary between Pages CMS editing and Cloudflare Stream media work. The
local fixture has now proved data-to-render behavior; hosted CMS save behavior and the protected
media app remain unexercised.

## Evidence status (2026-10-22)

The isolated local fixture test used labels `La salle`, `Les arrivages` and `À partager`. The
restored production data retains the labels `L'univers`, `La cuisine` and `Offre du moment`.
It retained the existing video UID
`dfdd8aa3018f15b13f2a75ec8ad1deae`; the decoded media reports 1920×1080, `readyState` 4 and
12.012 seconds. The existing intro timing remains 5000 ms with a 1190 ms shared fade-out.
Evidence is captured at
`/home/urist/Documents/boulot/ouvriere/.omc/evidence/pages-cms-spike/pages-cms-spike-final-menu.png`.

This is local data-to-render evidence only. Hosted Pages CMS field save, Cloudflare Access with
Zitadel SSO, Worker endpoints and Stream upload preparation were not exercised. The public site
is unchanged; this spike has not been merged or deployed.

## Current repository shape

The starter `.pages.yml` exposes the blog collection and `src/pages/about.md`. The landing page
currently hardcodes its three menu labels in `src/components/HeroVideo.astro` and the Stream MP4
reference in `src/config/demo.ts`. The page currently renders three display-only entries and a
legal disclosure from static source.

## Recommended MVP model

Move the editable landing content to `src/data/landing.json`:

```json
{
  "menuLabels": ["L'univers", "La cuisine", "Offre du moment"],
  "video": {
    "streamUid": "9741a9cf044d648f924291e94598083c"
  }
}
```

The `menuLabels` field is a French string list with minimum and maximum length three. The
`streamUid` field accepts a 32-character lowercase hexadecimal Cloudflare Stream UID and
represents an already uploaded, ready asset. The Astro build derives the customer Stream MP4
URL from this UID; editors do not enter a raw video file or arbitrary playback URL. The asset
must be confirmed ready for MP4 delivery before its UID is selected. A valid UID format proves
syntax only; it does not prove that the asset is ready or that its MP4 download is enabled.
Keep the current title, quote, attribution, legal text and animation timings outside the MVP
editor surface unless a later content decision promotes them.

The corresponding `.pages.yml` entry should be:

```yaml
content:
  - name: landing
    label: Landing page
    type: file
    format: json
    path: src/data/landing.json
    fields:
      - name: menuLabels
        label: Entrées du menu (3 maximum)
        type: string
        required: true
        list:
          min: 3
          max: 3
        options:
          minlength: 1
          maxlength: 80
      - name: video
        label: Vidéo
        type: object
        fields:
          - name: streamUid
            label: Identifiant vidéo Stream (32 caractères hexadécimaux minuscules)
            type: string
            required: true
            pattern:
              regex: "^[a-f0-9]{32}$"
              message: "Saisissez exactement 32 caractères hexadécimaux minuscules."
```

Validate the JSON shape, UID pattern and list length during the Astro build. This is a local
shape check only; the build must not make a network readiness request. A future media
preflight must verify that the selected UID is ready for MP4 delivery before publication. Until
that preflight exists, the runtime must retain its poster/fallback behavior for an unavailable
or not-yet-ready asset.

## Existing asset versus chef upload

| Case | MVP behavior | Required system boundary |
| --- | --- | --- |
| Edit the already uploaded sea video | Chef edits the 32-character `streamUid` in Pages CMS; the build derives the fixed customer MP4 URL. | Pages CMS string field plus Astro validation. |
| Upload or replace a video from the CMS | Not provided by the standard media field. | Separate uploader design using Cloudflare Stream direct creator uploads or a self-hosted backend. |

Pages CMS media configuration uploads repository files. It does not turn a media field into a
Cloudflare Stream integration. A chef upload flow would need Cloudflare's server-created,
one-time direct upload URL, browser upload, readiness polling, and a way to persist the new
UID only after the asset is ready. Cloudflare's direct upload flow is documented at
[Direct creator uploads](https://developers.cloudflare.com/stream/uploading-videos/direct-creator-uploads/).
For the current `<video>` player, the upload must be ready for MP4 delivery: request the
download, poll until its status is ready, and save the returned MP4 URL. See
[Stream video downloads](https://developers.cloudflare.com/stream/viewing-videos/download-videos/).
MP4 download activation and readiness are separate from accepting the upload.

The two viable follow-up designs are:

1. An external, authenticated uploader returns a ready Stream UID, after which the chef edits
   the UID in Pages CMS.
2. A self-hosted custom field and backend own the direct upload, readiness check and content
   write. If this backend is chosen, its design must fit the repository's Nix, OIDC, OPA and
   OpenBao secret-source policies; this spike does not implement it.

Pages CMS has no hosted plugin claim for this workflow. Its custom fields require CMS app code
and self-hosting, so the second option is a separate implementation project.

## Preferred media architecture

Use a separate protected Cloudflare Worker media application behind Cloudflare Access with a
Zitadel OIDC connector. Keep Pages CMS responsible for labels and storing the ready `streamUid`;
keep media upload and preparation outside the repository content write path. Cloudflare's
[Access Worker configuration](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)
and Zitadel's [Cloudflare OIDC integration](https://zitadel.com/docs/guides/integrate/services/cloudflare-oidc)
are the reference integration points. The public landing playback remains outside Access.

```text
Chef -> Access + Zitadel OIDC -> Worker: POST /v1/uploads
                         |
                         v
                 one-time Stream upload URL
                         |
                 browser uploads directly to Stream
                         |
Chef -> Worker: GET /v1/videos/{uid}
                         |
                         v
                 ready Stream UID + MP4 preparation status
                         |
Chef pastes ready UID into Pages CMS
```

The conceptual endpoint contract should cover `POST /v1/uploads`, `GET /v1/videos/{uid}`,
and `POST`/`GET /v1/videos/{uid}/downloads`. The Worker returns a ready UID only after Stream
processing and MP4 preparation are complete. It should verify the Access JWT issuer, audience,
signature and authentication context, then apply OPA policy per action and resource. Roles must
not be hardcoded in the Worker. It should use short-lived direct upload URLs, select duration,
quota, ownership, expiry and cost-reservation limits, and reject arbitrary source URLs. Browser
file bytes go directly to Stream; the Worker does not proxy the media.

Cloudflare Stream's [Workers binding](https://developers.cloudflare.com/stream/manage-video-library/bindings/)
is beta and supports `createDirectUpload` for basic uploads up to 200 MB, plus
`video(uid).details()` and `downloads.generate()`/`downloads.get()`. This binding does not
provide TUS. Larger or resumable uploads need the Stream REST/TUS path provisioned through a
scoped server token, with the token delivered to the Worker only through the approved OpenBao
secret injection path. Stream readiness and MP4 readiness are independent checks.

The first workflow is therefore: upload in the protected media app, wait for readiness, then
paste the UID into Pages CMS. Automatically writing CMS Git content requires a separate
GitHub App permissions decision. These endpoint names are a stable design concept, not an
implemented service.

Pages CMS authentication remains separate. It may use its documented email collaborator or
GitHub login flow; hosted Pages CMS does not document Zitadel OIDC integration, so this design
makes no single-SSO promise across the two applications. The Access/Zitadel connector uses the
documented confidential-code flow with PKCE disabled; this is connector-specific, not a general
recommendation. A direct Zitadel app would require its own PKCE decision. Worker implementation,
API binding, policy and secret configuration are follow-up work and are outside this spike.

## Editor and publication workflow

```text
Chef edits labels / ready Stream UID
              |
              v
Pages CMS saves a content commit on the selected editor branch
              |
              v
Approved merge reaches main
              |
              v
Existing Nix + GitHub Pages workflow builds and publishes /ouvriere/
```

Pages CMS can invite a collaborator by email without requiring that person to have a GitHub
account. The repository owner still needs the Pages CMS GitHub App installed. The documented
collaborator flow does not promise granular field-level permissions. Protected `main` writes
may fail; the publish policy should therefore keep editor branch commits separate from the
approved merge decision.

This repository's standing workflow does not create pull requests for the prototype. The
reviewed option is an editor branch followed by an approved merge into `main`, with publication
kept as a separate decision.

## Official references checked 2026-10-22

- [Pages CMS list fields](https://pagescms.org/docs/configuration/content/list/) — string lists
  support minimum and maximum item counts.
- [Pages CMS collaborators](https://pagescms.org/docs/configuration/collaborators/) — email
  invitations can be used without a GitHub account; content/media editing permissions are
  documented, while configuration management is separate.
- [Pages CMS media](https://pagescms.org/docs/configuration/media/) — media uploads target the
  repository; this is not a Stream integration.
- [Pages CMS custom fields](https://pagescms.org/docs/guides/creating-custom-field/) — custom fields
  require CMS app code and self-hosting.
- [Cloudflare Stream direct creator uploads](https://developers.cloudflare.com/stream/uploading-videos/direct-creator-uploads/)
  — server-created one-time upload URLs, browser upload and readiness handling.

## Spike boundary

The recommended first slice is low-friction editing of the three labels and selection of an
already uploaded, ready video. Chef upload UX is a separate decision after that slice. The
local fixture can prove the JSON data shape flowing into rendered landing content and UID
syntax validation. It cannot prove the hosted editor UI, Pages CMS save behavior or Stream
readiness until the repository is connected to the actual CMS app and media workflow. No
deployment or hosted CMS integration is claimed by this spike. Legal wording remains the
existing verbatim prototype text. The actual hosted CMS editor and protected media app remain
pending POC UI evidence. The current local poster and loop preprocessing are fixed build
artifacts; changing a UID alone does not automatically update them and requires a later media
handling design.

## Tracked follow-ups

- `ouv-jjp.2` — prove hosted CMS save and publish behavior with the landing file entry.
- `ouv-jjp.3` — design and implement the protected Zitadel/Cloudflare Worker media service.
- `ouv-jjp.4` — verify the end-to-end upload, readiness, UID handoff and publication workflow.
