# Setup

This app needs a real PostgreSQL database. Follow these steps once to get a working
local environment.

## 1. PostgreSQL

You already have PostgreSQL 17 running locally as a Windows service
(`postgresql-x64-17`). We don't use the `postgres` superuser directly — instead,
create a dedicated low-privilege role and database for this app.

Open pgAdmin (or run `psql` as the `postgres` user) and execute:

```sql
CREATE ROLE fashionsaas_app WITH LOGIN PASSWORD 'L0IdSEvKMVizM9ckseMBRT';
CREATE DATABASE fashionsaas_dev OWNER fashionsaas_app;
```

(You can pick a different password — just update `DATABASE_URL` in `.env.local` to match.)

If you'd rather use a hosted Postgres (Neon, Supabase, Railway, etc.), just grab the
connection string it gives you and skip to step 2.

## 2. Environment variables

Copy `.env.example` to `.env.local` (already done for you in this repo) and fill in:

```bash
DATABASE_URL="postgresql://fashionsaas_app:L0IdSEvKMVizM9ckseMBRT@localhost:5432/fashionsaas_dev"
AUTH_SECRET="<a long random string>"   # generate with: openssl rand -base64 32
```

`AUTH_SECRET` signs the session cookie (JWT). Never commit `.env.local` — it's
already in `.gitignore`.

## 3. Install dependencies (if you haven't)

```bash
npm install
```

## 4. Generate the Prisma client

```bash
npm run db:generate
```

## 5. Run migrations

Creates all tables from `prisma/schema.prisma`:

```bash
npm run db:migrate
```

This will prompt for a migration name the first time (e.g. `init`).

## 6. Seed the database

Creates a super admin and two demo organizations (each with an admin, categories,
products, customers, and orders):

```bash
npm run db:seed
```

Seeded logins (printed at the end of the seed script too):

| Role | Email | Password |
| --- | --- | --- |
| Super admin | `super@fashionsaas.com` | `SuperAdmin123!` |
| Org admin — Aurora Atelier | `admin@aurora-atelier.com` | `OrgAdmin123!` |
| Org admin — Nova Denim Co. | `admin@nova-denim.com` | `OrgAdmin123!` |

Public storefronts for the seeded orgs: `/store/aurora-atelier` and `/store/nova-denim`.

## 7. Start the app

```bash
npm run dev
```

Visit `http://localhost:3000/login`.

## Resetting the database during development

Drops and recreates everything, then re-runs migrations and the seed:

```bash
npm run db:reset
```

## Other useful commands

```bash
npm run db:studio    # visual database browser
npm run db:deploy    # apply pending migrations without prompting (CI/production)
```

## Notes

- Password reset emails aren't wired to a real email provider yet — in development,
  the reset link is printed to the server console (`npm run dev` output) instead of
  being emailed. Wire a provider (Resend, SES, etc.) in `lib/server/auth.ts` before
  going to production.
- `AUTH_SECRET` and `DATABASE_URL` are the only two things required to run the app.
  Everything else (organizations, products, orders, etc.) is created through the
  app itself or the seed script.
