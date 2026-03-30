import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { avatarColors } from '../lib/theme'

type Size = 'sm' | 'md' | 'lg' | 'xl'

const sizeMap: Record<Size, { wh: number; fontSize: number }> = {
  sm: { wh: 28,  fontSize: 11 },
  md: { wh: 40,  fontSize: 14 },
  lg: { wh: 56,  fontSize: 20 },
  xl: { wh: 80,  fontSize: 28 },
}

interface Props {
  name?: string
  color?: string
  size?: Size
  style?: object
}

export default function MemberAvatar({ name, color = 'violet', size = 'md', style }: Props) {
  const initial = (name || '?')[0].toUpperCase()
  const colors = avatarColors[color] ?? avatarColors.violet
  const { wh, fontSize } = sizeMap[size]

  return (
    <View
      style={[
        styles.container,
        { width: wh, height: wh, borderRadius: wh / 2, backgroundColor: colors.bg },
        style,
      ]}
    >
      <Text style={[styles.text, { fontSize, color: colors.text }]}>{initial}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
})
