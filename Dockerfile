# Stage 1: Build
FROM node:20.10-alpine AS builder
WORKDIR /usr/app

# 1. Копируем зависимости
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# 2. Копируем исходный код
COPY tsconfig.json ./
COPY public ./public
COPY src ./src

# 3. Собираем production-версию
RUN yarn build

# Stage 2: Production
# FROM node:20.10-alpine
# WORKDIR /usr/app
#
# # 1. Копируем только необходимое
# COPY --from=builder /usr/app/build ./build
# COPY --from=builder /usr/app/public ./public
# COPY --from=builder /usr/app/package.json ./
#
# # 2. Устанавливаем production-зависимости
# RUN yarn install --production --frozen-lockfile
#
# # 3. Устанавливаем serve для статики
# RUN yarn global add serve
#
# # 4. Запускаем сервер
# ENV NODE_ENV=production
# EXPOSE 3000
# CMD ["serve", "-s", "build", "-l", "3000"]