# Afterlight

A private, offline-first mobile app for exactly two people to capture and revisit shared memories over years.

Sideloaded Android APK (no Play Store), built with React Native + Expo + TypeScript, backed by SQLite (on-device) and Supabase (sync + backup).

## Spec

The full specification lives in [`docs/`](docs/):

1. [Product spec](docs/01-product-spec.md)
2. [UX flows & wireframes](docs/02-ux-flows-and-wireframes.md)
3. [Information architecture](docs/03-information-architecture.md)
4. [Database schema](docs/04-database-schema.md) ([Supabase SQL](docs/schema/supabase_schema.sql), [local SQLite SQL](docs/schema/local_sqlite_schema.sql))
5. [Design system](docs/05-design-system.md)
6. [Technical architecture](docs/06-technical-architecture.md)
7. [Roadmap](docs/07-roadmap.md)

The `spec-v1.0` tag marks the frozen specification implementation begins from. The app itself (the Expo project) has not been scaffolded yet — that's Phase 0 of the roadmap.

## Status

Pre-implementation. See `docs/07-roadmap.md` for the phase plan.
