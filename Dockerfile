FROM node:26-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
# Baked into the bundle by vite: origin of the auth service. Set it per
# environment at build time; empty means the app calls /api/ on its own origin.
ARG VITE_AUTH_BACKEND_URL=
ENV VITE_AUTH_BACKEND_URL=${VITE_AUTH_BACKEND_URL}
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
