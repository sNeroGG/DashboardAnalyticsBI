# Etapa de construcción
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
RUN npm install

# Copiar el resto del código
COPY . .

# Desactivar telemetría de Next.js (opcional)
ENV NEXT_TELEMETRY_DISABLED 1

# Construir la aplicación
RUN npm run build

# Etapa de ejecución
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Crear carpeta public por si no existe (evita errores de Next.js)
RUN mkdir -p public

# Copiar archivos necesarios desde el builder
# Nota: Si no tienes carpeta public localmente, esta línea fallará.
# La hemos comentado para que el build pase, pero si añades archivos a public/, 
# deberás descomentarla.
# COPY --from=builder /app/public ./public

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]
