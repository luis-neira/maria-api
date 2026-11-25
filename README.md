# maria-api

A small REST API proof of concept on Fastify, Kysely and [PGlite](https://pglite.dev) (Postgres in WebAssembly, so no database server to install).

## Requirements

- Node.js (version in `engines` in `package.json`)
- `psql` on your `PATH` (macOS: `brew install libpq`, then add `/opt/homebrew/opt/libpq/bin` to `PATH`)

## Getting started

```sh
npm install

# Terminal 1: leave running
npm run db:serve

# Terminal 2
npm run db:migrate
npm run db:seed
echo 'API_KEY=dev-key' > .env.local   # once; git-ignored
npm run dev

curl -H 'x-api-key: dev-key' localhost:3000/api/<resource>
```

## Scripts

See `scripts` in `package.json`.

## Configuration

- `.env` (committed) holds `DATABASE_URL` for the local database.
- `.env.local` (git-ignored) holds `API_KEY` and any real credentials. It overrides `.env` under `npm run dev`.
- In a deployment, set the variables in the environment and run `npm start`.
