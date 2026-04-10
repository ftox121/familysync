# FamilySync Backend Server

Node.js + Express + PostgreSQL backend для приложения FamilySync.

## Установка

1. Установи зависимости:
```bash
cd server
npm install
```

2. Установи PostgreSQL (если еще не установлен):
- Windows: https://www.postgresql.org/download/windows/
- Mac: `brew install postgresql`

3. Создай базу данных:
```bash
psql -U postgres
CREATE DATABASE familysync;
\q
```

4. Настрой переменные окружения:
```bash
cp .env.example .env
# Отредактируй .env и укажи свои данные
```

5. Запусти миграции:
```bash
npm run db:migrate
npm run db:rewards
```

6. Запусти сервер:
```bash
npm run dev
```

Сервер запустится на http://localhost:3000

## API Endpoints

### Auth
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Получить текущего пользователя

### Families
- `GET /api/families` - Получить семьи пользователя
- `POST /api/families` - Создать семью
- `GET /api/families/:id/members` - Получить участников семьи
- `POST /api/families/:id/members` - Добавить участника
- `PUT /api/families/members/:id` - Обновить участника

### Tasks
- `GET /api/tasks?family_id=X` - Получить задачи семьи
- `GET /api/tasks/:id` - Получить задачу
- `POST /api/tasks` - Создать задачу
- `PUT /api/tasks/:id` - Обновить задачу
- `DELETE /api/tasks/:id` - Удалить задачу

### Notifications
- `GET /api/notifications` - Получить уведомления
- `POST /api/notifications` - Создать уведомление
- `PUT /api/notifications/:id` - Отметить как прочитанное

## Структура БД

- `users` - Пользователи
- `families` - Семьи
- `family_members` - Участники семей
- `tasks` - Задачи
- `rewards` - Награды и бонусы
- `notifications` - Уведомления
