// minXp = минимальный XP для разблокировки аватара
export const ANIMAL_AVATARS = [
  { id: 'cat',      emoji: '🐱', name: 'Котик',      minXp: 0    },
  { id: 'dog',      emoji: '🐶', name: 'Собачка',    minXp: 0    },
  { id: 'rabbit',   emoji: '🐰', name: 'Зайчик',     minXp: 0    },
  { id: 'bear',     emoji: '🐻', name: 'Мишка',      minXp: 0    },
  { id: 'hamster',  emoji: '🐹', name: 'Хомячок',    minXp: 0    },
  { id: 'mouse',    emoji: '🐭', name: 'Мышка',      minXp: 0    },
  { id: 'chicken',  emoji: '🐥', name: 'Цыплёнок',   minXp: 0    },
  { id: 'penguin',  emoji: '🐧', name: 'Пингвин',    minXp: 0    },
  { id: 'frog',     emoji: '🐸', name: 'Лягушка',    minXp: 0    },
  // Ответственный (250+)
  { id: 'panda',    emoji: '🐼', name: 'Панда',      minXp: 250  },
  { id: 'fox',      emoji: '🦊', name: 'Лисичка',    minXp: 250  },
  { id: 'monkey',   emoji: '🐵', name: 'Обезьянка',  minXp: 250  },
  { id: 'pig',      emoji: '🐷', name: 'Хрюшка',     minXp: 250  },
  // Семейный карандаш (800+)
  { id: 'koala',    emoji: '🐨', name: 'Коала',      minXp: 800  },
  { id: 'turtle',   emoji: '🐢', name: 'Черепашка',  minXp: 800  },
  { id: 'owl',      emoji: '🦉', name: 'Сова',       minXp: 800  },
  // Опора семьи (2000+)
  { id: 'lion',     emoji: '🦁', name: 'Лев',        minXp: 2000 },
  { id: 'tiger',    emoji: '🐯', name: 'Тигр',       minXp: 2000 },
  // Легенда семьи (4500+)
  { id: 'unicorn',  emoji: '🦄', name: 'Единорог',   minXp: 4500 },
  { id: 'dragon',   emoji: '🐉', name: 'Дракон',     minXp: 4500 },
]

export const getAnimalAvatar = (id) => {
  return ANIMAL_AVATARS.find(a => a.id === id) || ANIMAL_AVATARS[0]
}
