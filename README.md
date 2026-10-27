# Frontend

Production web frontend for the Gia Phả (family tree) application.
Built with TypeScript, Lit, Tailwind CSS, and Vite. See [PLAN.md](PLAN.md)
for the stack decisions and implementation plan.

## Develop

```bash
pnpm install
pnpm dev
```

Other scripts: `pnpm build`, `pnpm test`, `pnpm typecheck`, `pnpm check`.

## Run

With Docker:

```bash
docker build -t giapha-frontend .
docker run -p 8081:80 giapha-frontend
```

Or via the umbrella repo's `docker-compose.yml` (`frontend` service).

## History

This repo was extracted with full git history from the
[`gia-pha/full`](https://github.com/gia-pha/full) monorepo (folder `frontend`),
as part of the split into one repo per service described in
`docs/microservices-deployment-plan.md` there. `gia-pha/full` now references
this repo as a git submodule for local development.

## License

MIT — see [LICENSE](LICENSE).
