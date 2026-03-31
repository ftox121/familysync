import { Text, View } from 'react-native'
import { AVATAR_PALETTE, AVATAR_SIZES } from '../lib/utils'
import { getAnimalAvatar } from '../lib/avatars'

export default function MemberAvatar({ name, color = 'violet', size = 'md', animalId }) {
  const pal = AVATAR_PALETTE[color] ?? AVATAR_PALETTE.violet
  const dims = AVATAR_SIZES[size] ?? AVATAR_SIZES.md

  // Если есть иконка животного - показываем её
  if (animalId) {
    const animal = getAnimalAvatar(animalId)
    return (
      <View
        style={{
          width: dims.wh,
          height: dims.wh,
          borderRadius: dims.wh / 2,
          backgroundColor: pal.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: dims.font * 1.2 }}>{animal.emoji}</Text>
      </View>
    )
  }

  // Иначе показываем первую букву имени
  const initial = (name || '?')[0].toUpperCase()
  return (
    <View
      style={{
        width: dims.wh,
        height: dims.wh,
        borderRadius: dims.wh / 2,
        backgroundColor: pal.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: dims.font, fontWeight: '700', color: pal.text }}>{initial}</Text>
    </View>
  )
}
