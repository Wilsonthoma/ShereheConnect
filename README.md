  # ShereheConnect

> A web-based platform connecting people with events across Kenya.

ShereheConnect enables attendees to discover events, book tickets, and receive secure e-tickets. Organizers create and manage events with real-time dashboards. Admins approve events and oversee platform integrity.

## Status

Project in initial setup phase — workspace scaffolding in progress.

## Planned Stack

- **Backend**: NestJS + TypeScript
- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS
- **Database**: PostgreSQL 16 + PostGIS
- **Cache**: Redis
- **Payments**: M-Pesa Daraja (C2B + STK Push)
- **Maps**: OpenStreetMap + Leaflet
- **Email**: Resend

## Repository Structure

    apps/
      api/          # Backend API (NestJS)
      web/          # Frontend application (Next.js)
    packages/
      shared/       # Shared types and validators
    docs/           # Architecture and schema documentation
    infra/          # Docker and deployment configs
    scripts/        # Development helper scripts

## Getting Started

    pnpm install
    cp .env.example .env
    docker compose -f infra/docker-compose.yml up -d
    pnpm dev

## License

Proprietary. All rights reserved.
