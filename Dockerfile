# syntax=docker/dockerfile:1.7
#
# Single Dockerfile shared by all three Vite SPAs in the monorepo. Pick which
# one to build via the APP build-arg:
#
#   docker build --build-arg APP=web        -t web .
#   docker build --build-arg APP=dashboard  -t dashboard .
#   docker build --build-arg APP=backoffice -t backoffice .
#
# VITE_PUBLIC_API_ORIGIN is baked at build time. Override it via --build-arg
# when targeting a non-default backend (defaults to localhost:8000 to match dev).

ARG APP=web

# ---- builder ----------------------------------------------------------------
FROM node:22-alpine AS builder

ARG APP
ARG VITE_PUBLIC_API_ORIGIN=http://localhost:8000

ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    CI=true

RUN corepack enable

WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc* ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/dashboard/package.json ./apps/dashboard/package.json
COPY apps/backoffice/package.json ./apps/backoffice/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/auth/package.json ./packages/auth/package.json
COPY packages/components/package.json ./packages/components/package.json

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .

RUN echo "VITE_PUBLIC_API_ORIGIN=${VITE_PUBLIC_API_ORIGIN}" > .env.production

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm --filter "${APP}..." run build


# ---- runtime ----------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

ARG APP

ENV APP_NAME=${APP}

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /repo/apps/${APP}/dist /usr/share/nginx/html

EXPOSE 80
