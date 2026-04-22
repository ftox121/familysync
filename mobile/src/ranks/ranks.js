export const RANKS = [
  {
    id: 0,
    key: 'novice',
    name: 'Новичок',
    xpMin: 0,
    xpMax: 250,
    color: '#22C55E',
    gradFrom: '#DCFCE7',
    gradTo: '#86EFAC',
    emoji: '🌱',
    type: 'sprout',
    xpBonusPct: 0,
    perks: [
      'Доступ к семейным задачам',
      'Семейный чат',
      'Базовые уведомления',
    ],
    locked: [
      '+10% XP к каждой задаче',
      'Аналитика семьи',
      'Эксклюзивные аватары',
    ],
  },
  {
    id: 1,
    key: 'responsible',
    name: 'Ответственный',
    xpMin: 250,
    xpMax: 800,
    color: '#6366F1',
    gradFrom: '#E0E7FF',
    gradTo: '#A5B4FC',
    emoji: '⭐',
    type: 'star',
    xpBonusPct: 10,
    perks: [
      'Всё из «Новичка»',
      '+10% XP к каждой задаче',
      'Эксклюзивные аватары — базовый набор',
    ],
    locked: [
      'Аналитика семьи',
      'Продвинутые аватары',
    ],
  },
  {
    id: 2,
    key: 'pencil',
    name: 'Семейный карандаш',
    xpMin: 800,
    xpMax: 2000,
    color: '#F97316',
    gradFrom: '#FFEDD5',
    gradTo: '#FED7AA',
    emoji: '✏️',
    type: 'pencil',
    xpBonusPct: 20,
    perks: [
      'Всё из «Ответственного»',
      '+20% XP к каждой задаче',
      'Аналитика семьи разблокирована',
      'Продвинутые аватары — набор 2',
    ],
    locked: [
      'Редкие аватары',
      'Особый значок в профиле',
    ],
  },
  {
    id: 3,
    key: 'pillar',
    name: 'Опора семьи',
    xpMin: 2000,
    xpMax: 4500,
    color: '#F43F5E',
    gradFrom: '#FFE4E6',
    gradTo: '#FDA4AF',
    emoji: '🛡️',
    type: 'shield',
    xpBonusPct: 35,
    perks: [
      'Всё из «Семейного карандаша»',
      '+35% XP к каждой задаче',
      'Редкие аватары — Лев, Тигр',
      'Особый значок в профиле',
    ],
    locked: [
      'Легендарные аватары',
      'Статус Легенды семьи',
    ],
  },
  {
    id: 4,
    key: 'legend',
    name: 'Легенда семьи',
    xpMin: 4500,
    xpMax: null,
    color: '#F59E0B',
    gradFrom: '#FEF3C7',
    gradTo: '#FCD34D',
    emoji: '👑',
    type: 'crown',
    xpBonusPct: 50,
    perks: [
      'Все привилегии',
      '+50% XP к каждой задаче',
      'Легендарные аватары — Единорог, Дракон',
      'Особый статус и значок в семье',
      'Ранний доступ к новым функциям',
    ],
    locked: [],
  },
]

export const getRankByXP = (xp) => {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].xpMin) return RANKS[i]
  }
  return RANKS[0]
}

export const RANK_ANALYTICS_MIN_XP = 800  // Семейный карандаш
