# ===== 1. Этап сборки =====
FROM node:18-alpine AS builder

# Используем нейтральное имя (не /app)
WORKDIR /frontend

# Копируем только нужное
COPY package*.json ./
RUN npm ci

# Копируем исходники (включая твою папку components/app)
COPY public ./public
COPY src ./src

# Сборка
RUN npm run build

# ===== 2. Продакшен =====
FROM nginx:alpine
COPY --from=builder /frontend/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]