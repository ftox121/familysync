// Набор иконок животных для аватаров
export const ANIMAL_AVATARS = [
  { id: 'cat', emoji: '🐱', name: 'Котик' },
  { id: 'dog', emoji: '🐶', name: 'Собачка' },
  { id: 'rabbit', emoji: '🐰', name: 'Зайчик' },
  { id: 'bear', emoji: '🐻', name: 'Мишка' },
  { id: 'panda', emoji: '🐼', name: 'Панда' },
  { id: 'fox', emoji: '🦊', name: 'Лисичка' },
  { id: 'lion', emoji: '🦁', name: 'Львёнок' },
  { id: 'tiger', emoji: '🐯', name: 'Тигрёнок' },
  { id: 'koala', emoji: '🐨', name: 'Коала' },
  { id: 'hamster', emoji: '🐹', name: 'Хомячок' },
  { id: 'mouse', emoji: '🐭', name: 'Мышка' },
  { id: 'pig', emoji: '🐷', name: 'Хрюшка' },
  { id: 'frog', emoji: '🐸', name: 'Лягушка' },
  { id: 'monkey', emoji: '🐵', name: 'Обезьянка' },
  { id: 'chicken', emoji: '🐥', name: 'Цыплёнок' },
  { id: 'penguin', emoji: '🐧', name: 'Пингвин' },
  { id: 'owl', emoji: '🦉', name: 'Сова' },
  { id: 'unicorn', emoji: '🦄', name: 'Единорог' },
  { id: 'dragon', emoji: '🐉', name: 'Дракончик' },
  { id: 'turtle', emoji: '🐢', name: 'Черепашка' },
]

export const getAnimalAvatar = (id) => {
  return ANIMAL_AVATARS.find(a => a.id === id) || ANIMAL_AVATARS[0]
}
