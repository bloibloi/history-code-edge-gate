# History → Quiz → Code Edge Gate

The Google Site history gate for the [Code Edge](https://github.com/bloibloi/Code-edge)
project. This repository does not modify Code Edge at all -- it only builds
the page that sits in front of it.

Everything here is a static site. There is no backend to deploy.

## Flow

```text
Google Site (Embed by URL gadget)
    └── this page: history article + quiz
          └── correct answer
                └── iframe loads the real Code Edge origin
                    (https://bloibloi.github.io/Code-edge/)
```

1. A Google Site embeds this page's URL (Insert → Embed → By URL).
2. The page shows a short history article and one multiple-choice question.
3. On submit, the browser compares the chosen answer to `CORRECT_ANSWER`
   in `gate.js`. One fixed question, one fixed answer, every time.
4. Only on a match does the page reveal the embedded view: an `<iframe>`
   that starts at `about:blank` and is only then pointed at Code Edge, so
   nothing about Code Edge loads before the quiz is passed.
5. A visible "Open Code Edge in a new tab" link appears alongside the
   iframe, in case the browser blocks the embedded view (see below).

## How strong is the gate?

It is a game mechanic, not a security boundary, and it should not be
mistaken for one. The answer check runs in the browser, so anyone willing
to read the page source -- or simply to click all four options -- gets
through.

That is a deliberate trade, because there is nothing secret on the other
side of the gate: `https://bloibloi.github.io/Code-edge/` is a public page,
already linked from that project's own README. A server-side check would
add real rate-limiting but would still be guarding a public URL.

An earlier version of this repo did exactly that with a Cloudflare Worker
(quiz answer as a Worker secret, plus a Durable Object that locked an IP out
for 15 minutes after 5 wrong answers). It worked and was tested, but it was
never deployed. It lives in commit `8900450` if it is ever wanted:

```bash
git checkout 8900450 -- worker wrangler.jsonc
```

## Why the iframe loads Code Edge's real origin

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

So the iframe navigates straight to `https://bloibloi.github.io/Code-edge/`
at its real origin, and every existing Code Edge feature keeps working
exactly as it does today.

## If iframe embedding is blocked

Whether an iframe is allowed to render another site depends on headers that
site sends (`X-Frame-Options`, or a CSP `frame-ancestors` directive). Code
Edge's `index.html` doesn't set either, and GitHub Pages doesn't add them by
default, so embedding is expected to work -- Code Edge's own `embed.html`
already relies on the same thing. But this isn't something this repository
controls, and browsers give JavaScript no reliable way to detect that an
iframe was silently blocked by those headers versus loading normally blank.

Rather than pretend to auto-detect it, the "Open Code Edge in a new tab"
link is always shown next to the iframe once the quiz is passed. If the
embedded view ever stays blank, that link is the fallback path.

## Changing the question or the answer

The article, the question, and the four options live in `index.html`. To
change which option is correct, set `CORRECT_ANSWER` at the top of
`gate.js` to match that option's `value` exactly.

## Deploy

Push to `main` -- `.github/workflows/pages.yml` publishes the site root to
GitHub Pages. Then, in Google Sites, add an **Embed → By URL** block
pointing at the published Pages URL.

## Local preview

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.
