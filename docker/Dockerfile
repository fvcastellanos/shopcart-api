# syntax=docker/dockerfile:1

# =============================================================================
# Etapa 1: build
# Compila TypeScript (modo strict) a JavaScript en dist/
# =============================================================================
# IMPORTANTE: se usa una imagen Debian (glibc) porque TypeScript 7 (tsc) es un
# binario nativo que NO publica build para musl/Alpine. Usar Alpine aquí
# haría fallar `npm run build`.
FROM node:26-bookworm-slim AS builder

WORKDIR /app

# 1) Instalar dependencias (build reproducible gracias al package-lock.json).
#    Incluye la dependencia opcional @typescript/typescript-linux-x64 (glibc).
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# 2) Compilar el código fuente -> dist/
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# 3) Eliminar dependencias de desarrollo para la imagen final
RUN npm prune --omit=dev

# =============================================================================
# Etapa 2: runtime (imagen final, mínima)
# =============================================================================
FROM node:26-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

# Copiar solo lo necesario para ejecutar la API
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/dist ./dist

# Ejecutar como usuario sin privilegios
USER node

# Puerto por defecto de la API (configurable con la variable PORT)
EXPOSE 4000

# Healthcheck con el fetch nativo de Node (no requiere curl/wget)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "const p=process.env.PORT||4000;fetch('http://127.0.0.1:'+p+'/v1/actuator/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server.js"]

