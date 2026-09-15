# Quiz Gate Worker

A small Cloudflare Worker with exactly two routes. It does not proxy or fetch
Code Edge's content -- it only checks the quiz answer and, on success, hands
back the fixed Code Edge URL for the frontend to open. This keeps the Worker
narrowly scoped instead of turning it into a general-purpose proxy.

## Endpoints

- `POST /gate/verify` with `{ "answer": "..." }`: hashes the answer (salted,
  constant-time compared) against the `QUIZ_ANSWER_HASH` secret. A correct
  answer returns `{ "ok": true, "redirectUrl": "..." }`. Failed attempts are
  rate-limited per IP by a Durable Object: 5 wrong answers locks that IP out
  for 15 minutes.
- `GET /gate/health`: reports whether `QUIZ_ANSWER_HASH` is configured.

## Configure

From this directory:

```bash
npm install
node scripts/hash-answer.mjs "The Bombe"   # prints the secret value
npx wrangler secret put QUIZ_ANSWER_HASH   # paste the printed value
npm run deploy
```

`QUIZ_ANSWER_HASH` must be a Worker secret, never a plaintext variable or a
value committed to the repository -- otherwise the correct answer would be
readable from the deployed Worker's configuration.

`ALLOWED_ORIGIN` and `CODE_EDGE_URL` are plain (non-secret) vars in
`wrangler.jsonc`. `CODE_EDGE_URL` is already the public Code Edge site, so
nothing sensitive is returned by `/gate/verify` -- the Worker exists to gate
*when* the frontend is told to navigate there, not to hide a secret backend
address.

After deployment, put the Worker's `*.workers.dev` origin in root
`config.js` as `window.CODE_EDGE_GATE_API`, and update the `connect-src`
entry in `index.html`'s Content-Security-Policy meta tag to match.
