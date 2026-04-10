import { createContext, useCallback, useContext, useRef } from 'react'
import { Animated } from 'react-native'

const TabBarContext = createContext(null)

/**
 * Провайдер для управления видимостью таб-бара.
 * translateY анимируется от 0 (видим) до 120 (скрыт).
 */
export function TabBarProvider({ children }) {
  const translateY = useRef(new Animated.Value(0)).current
  const lastOffsetY = useRef(0)
  const isHidden = useRef(false)
  const scrollThreshold = 8 // минимальный сдвиг для реакции

  const show = useCallback(() => {
    if (!isHidden.current) return
    isHidden.current = false
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start()
  }, [translateY])

  const hide = useCallback(() => {
    if (isHidden.current) return
    isHidden.current = true
    Animated.spring(translateY, {
      toValue: 120,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start()
  }, [translateY])

  /**
   * Подключить к onScroll любого ScrollView / FlatList:
   *   <FlatList onScroll={handleScroll} scrollEventThrottle={16} />
   */
  const handleScroll = useCallback(
    (event) => {
      const currentY = event.nativeEvent.contentOffset.y
      const diff = currentY - lastOffsetY.current

      // Не реагируем на bounce (отрицательный offset) и мелкие сдвиги
      if (currentY <= 0) {
        show()
        lastOffsetY.current = currentY
        return
      }

      if (Math.abs(diff) < scrollThreshold) return

      if (diff > 0) {
        hide() // скроллим вниз → прячем
      } else {
        show() // скроллим вверх → показываем
      }

      lastOffsetY.current = currentY
    },
    [show, hide]
  )

  return (
    <TabBarContext.Provider value={{ translateY, handleScroll, show, hide }}>
      {children}
    </TabBarContext.Provider>
  )
}

export function useTabBar() {
  const ctx = useContext(TabBarContext)
  if (!ctx) throw new Error('useTabBar must be used within TabBarProvider')
  return ctx
}
