# History → Quiz → Code Edge Gate

The Google Site history gate for the [Code Edge](https://github.com/bloibloi/Code-edge)
project. This repository does not modify Code Edge at all -- it only builds
the page that sits in front of it.

## Flow

```text
Google Site (Embed by URL gadget)
    └── this page: history article + quiz
          └── correct answer
                └── POST /gate/verify (Cloudflare Worker, rate-limited)
                      └── on success: iframe navigates to the real
                          Code Edge origin (https://bloibloi.github.io/Code-edge/)
```

1. A Google Site embeds this page's URL (Insert → Embed → By URL).
2. The page shows a short history article and one multiple-choice question.
   The correct answer is never present in the page's HTML or JavaScript --
   only a salted hash of it lives in the Worker.
3. On submit, the browser calls the Worker's `POST /gate/verify`. Only a
   correct answer gets back `{ ok: true, redirectUrl }`.
4. Only then does the page reveal the embedded view: an `<iframe>` that
   starts at `about:blank` and is pointed at the real Code Edge URL only
   after the Worker's gate approves it, so nothing about Code Edge loads
   before the quiz is passed.
5. A visible "Open Code Edge in a new tab" link appears alongside the
   iframe, pointed at the same Worker-approved URL, in case the browser
   blocks the embedded view (see below).

## Why the iframe loads Code Edge's real origin (and isn't proxied)

The Code Edge pairing Worker (`iphone-remote-pairing`, in the Code-edge
repo) enforces strict CORS: it only answers `Origin: https://bloibloi.github.io`
(or `localhost:8080` for local dev) and echoes back that fixed origin
regardless of who's actually asking. Code Edge's own frontend JS calls that
Worker directly from the browser for Plex, pairing codes, and iPhone
streaming.

That means anything which would change Code Edge's effective origin inside
the iframe -- fetching its HTML through a proxy and injecting it with
`srcdoc`/`document.write`, or serving it from a different domain -- gives
the frame an opaque or foreign origin. The pairing Worker's CORS check would
then reject every request from inside it, silently breaking Plex, iPhone
streaming, and pairing codes.

Since touching Code Edge (including loosening that CORS policy) was
explicitly off the table, this gate's Worker instead proxies the *decision*,
not the *content*: `/gate/verify` is the fixed, narrowly-scoped Cloudflare
Worker endpoint that authorizes the flow, and only after it approves does
the iframe navigate straight to `https://bloibloi.github.io/Code-edge/` at
its real origin, so every existing Code Edge feature keeps working exactly
as it does today.

## If iframe embedding is blocked

Whether an iframe is allowed to render another site depends on headers that
site sends (`X-Frame-Options`, or a CSP `frame-ancestors` directive). Code
Edge's `index.html` doesn't set either, and GitHub Pages doesn't add them by
default, so embedding is expected to work -- Code Edge's own `embed.html`
already relies on the same thing. But this isn't something this repository
controls, and browsers give JavaScript no reliable way to detect that an
iframe was silently blocked by those headers versus loading normally blank.

Rather than pretend to auto-detect it, the "Open Code Edge in a new tab"
link is always shown next to the iframe once the quiz is passed. It's a
normal, fully authenticated redirect (opened only after the same
`/gate/verify` approval, to the same URL) -- if the embedded view ever stays
blank, that link is the fallback path.

## What is and isn't exposed to the browser

- No Plex token, Worker secret, or private backend URL is added to any
  frontend file here. `config.js` only holds this gate's own Worker's public
  `*.workers.dev` origin, the same pattern Code-edge's own `config.js` uses
  for its pairing Worker.
- The quiz's correct answer lives only as a salted hash in a Worker secret
  (`QUIZ_ANSWER_HASH`); see `worker/README.md`.
- `CODE_EDGE_URL` (the destination the Worker returns) is Code Edge's own
  public GitHub Pages URL, already published in that project's README --
  it is not a secret.
- The gate Worker exposes exactly two routes (`/gate/verify`, `/gate/health`)
  and only ever talks to its own Durable Object for rate limiting -- it does
  not fetch or forward requests to any other host, so it can't be used as an
  open proxy.

## Deploy

1. `worker/`: follow `worker/README.md` to set the `QUIZ_ANSWER_HASH` secret
   and `npm run deploy`.
2. Put the deployed Worker's URL in root `config.js`
   (`window.CODE_EDGE_GATE_API`) and in the `connect-src` entry of the CSP
   meta tag in `index.html`.
3. Push to `main` -- `.github/workflows/pages.yml` deploys the site root to
   GitHub Pages.
4. In Google Sites, add an **Embed → By URL** block pointing at the deployed
   Pages URL.

## Local preview

```bash
python3 -m http.server 8080
```

`worker/wrangler.jsonc` already allows `http://localhost:8080` in its CORS
check for local testing against a `wrangler dev` instance.
