# FamilySync — СемьяПлан

Семейный планировщик задач с геймификацией. Мобильное React-приложение.

## Стек

- React 18 + Vite
- React Router v6
- TanStack Query v5
- Framer Motion
- Tailwind CSS
- date-fns (русская локаль)
- Sonner (тосты)
- Lucide React (иконки)

## Запуск

```bash
npm install
npm run dev
```

Открыть: http://localhost:5173

## Структура

```
src/
├── api/
│   └── base44Client.js   # SDK-клиент (localStorage-стаб для разработки)
├── components/
│   ├── BottomNav.jsx
│   ├── LeaderBoard.jsx
│   ├── MemberAvatar.jsx
│   ├── StatsBar.jsx
│   └── TaskCard.jsx
├── context/
│   └── FamilyContext.jsx  # Глобальный стейт семьи
├── lib/
│   ├── queryClient.js
│   └── utils.js           # Константы, хелперы
├── pages/
│   ├── AddTask.jsx
│   ├── CalendarView.jsx
│   ├── Notifications.jsx
│   ├── Onboarding.jsx
│   ├── Profile.jsx
│   ├── TaskDetail.jsx
│   └── Tasks.jsx
├── App.jsx
├── index.css
└── main.jsx
```

## Подключение к Base44

В файле `src/api/base44Client.js` замените весь код на:

```js
import { base44 } from '@base44/sdk'
export { base44 }
```

И убедитесь что пакет `@base44/sdk` установлен в проекте.

## Возможности

- Создание и присоединение к семейной группе по коду приглашения
- Задачи с приоритетами, категориями, дедлайнами
- Назначение задач участникам семьи
- Геймификация: баллы, уровни, рейтинг
- Уведомления
- Календарный вид
- Профиль с прогрессом
