import React, { useState, useEffect, useRef } from 'react'
import { View, StyleSheet, Dimensions, Platform, Animated } from 'react-native'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

export default function GlowBackground({ children }) {
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 })
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: Platform.OS !== 'web',
    }).start()

    if (Platform.OS === 'web') {
      const handleMouseMove = (e) => {
        setMousePos({ x: e.clientX, y: e.clientY })
      }
      window.addEventListener('mousemove', handleMouseMove)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
      }
    }
  }, [fadeAnim])

  // Custom inline styles for Web
  const webStyles = {
    gridOverlay: Platform.OS === 'web' ? {
      backgroundImage: `
        linear-gradient(to right, rgba(26,26,26,0.02) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(26,26,26,0.02) 1px, transparent 1px)
      `,
      backgroundSize: '40px 40px',
    } : {},
    cursorRing: Platform.OS === 'web' ? {
      left: mousePos.x - 16,
      top: mousePos.y - 16,
      transition: 'left 0.1s cubic-bezier(0.25, 1, 0.5, 1), top 0.1s cubic-bezier(0.25, 1, 0.5, 1), transform 0.15s ease',
      pointerEvents: 'none',
    } : {}
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Design Grid backdrop (very minimal) */}
      <View style={[styles.gridOverlay, webStyles.gridOverlay]} />

      {/* Lagging outer cursor ring (Web only) */}
      {Platform.OS === 'web' && (
        <View 
          pointerEvents="none"
          style={[styles.cursorRing, webStyles.cursorRing]} 
        />
      )}

      <View style={styles.content}>
        {children}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5', // Sophisticated off-white / light sand canvas
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
    ...Platform.select({
      default: {
        borderWidth: 0.5,
        borderColor: 'rgba(26,26,26,0.015)',
      }
    }),
  },
  cursorRing: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#1A1A1A',
    zIndex: 9999,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
})
