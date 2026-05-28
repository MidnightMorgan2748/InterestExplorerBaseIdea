import { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, ActivityIndicator, Animated, Platform } from 'react-native'
import { supabase } from '../../lib/supabase'
import GlowBackground from '../../components/GlowBackground'

// Safe Web-only custom style definitions
const webStyles = {
  title: Platform.OS === 'web' ? {
    color: '#1A1A1A',
  } : {},
  card: Platform.OS === 'web' ? {
    transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s ease',
  } : {},
  cardSelected: Platform.OS === 'web' ? {
    boxShadow: '4px 4px 0px #1A1A1A',
  } : {},
  button: Platform.OS === 'web' ? {
    boxShadow: '4px 4px 0px #1A1A1A',
    transition: 'transform 0.1s ease, box-shadow 0.1s ease',
  } : {},
  buttonDisabled: Platform.OS === 'web' ? {
    boxShadow: 'none',
  } : {}
}

// Playful Neo-brutalist Interest Card with spring popup micro-animations
function InterestCard({ item, isSelected, onPress }) {
  const scale = useRef(new Animated.Value(1)).current
  const cardPressVal = useRef(new Animated.Value(isSelected ? 1 : 0)).current

  useEffect(() => {
    Animated.spring(cardPressVal, {
      toValue: isSelected ? 1 : 0,
      friction: 6,
      tension: 100,
      useNativeDriver: false,
    }).start()
  }, [isSelected])

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.94,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: isSelected ? 1.02 : 1,
      friction: 4,
      tension: 60,
      useNativeDriver: true,
    }).start()
  }

  // Interpolations for styling
  const bgInterpolate = cardPressVal.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFFFFF', '#F4D35E'] // Flat pastel yellow accent on select
  })

  const shadowInterpolate = cardPressVal.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 4]
  })

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale }] }}>
      <Animated.View style={[
        styles.card,
        webStyles.card,
        isSelected && webStyles.cardSelected,
        {
          backgroundColor: bgInterpolate,
          shadowOffset: Platform.OS !== 'web' ? { width: shadowInterpolate, height: shadowInterpolate } : undefined,
          shadowOpacity: Platform.OS !== 'web' ? isSelected ? 1 : 0 : undefined,
        }
      ]}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.cardClickable}
        >
          <Text style={[styles.icon, isSelected && styles.iconSelected]}>{item.icon}</Text>
          <Text style={[styles.cardText, isSelected && styles.cardTextSelected]}>
            {item.name}
          </Text>
          {isSelected && <View style={styles.selectedBadge} />}
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  )
}

export default function InterestPickerScreen({ navigation, onInterestsSaved }) {
  const [interests, setInterests] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Progress and motion animations
  const progressAnim = useRef(new Animated.Value(0)).current
  const buttonPressVal = useRef(new Animated.Value(0)).current

  useEffect(() => {
    fetchInterests()
  }, [])

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: Math.min(selected.length / 3, 1),
      duration: 300,
      useNativeDriver: false,
    }).start()
  }, [selected])

  async function fetchInterests() {
    const { data, error } = await supabase.from('interests').select('*')
    if (error) Alert.alert('Error', error.message)
    else setInterests(data)
    setLoading(false)
  }

  function toggleInterest(id) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  async function saveInterests() {
    if (selected.length < 3) {
      Alert.alert('Pick at least 3 interests to continue')
      return
    }
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        Alert.alert('Error', 'No user found. Please log in again.')
        setSaving(false)
        return
      }

      await supabase.from('profiles').upsert({ id: user.id })

      const rows = selected.map(interest_id => ({
        user_id: user.id,
        interest_id
      }))

      const { error: insertError } = await supabase
        .from('user_interests')
        .insert(rows)

      if (insertError) {
        Alert.alert('Error saving interests', insertError.message)
      } else {
        onInterestsSaved()
      }
    } catch (e) {
      Alert.alert('Error', e.message)
    }

    setSaving(false)
  }

  const animateButtonPress = (toVal) => {
    if (selected.length < 3) return
    Animated.timing(buttonPressVal, {
      toValue: toVal,
      duration: 100,
      useNativeDriver: false,
    }).start()
  }

  if (loading) {
    return (
      <GlowBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A1A1A" />
          <Text style={styles.loadingText}>CHARTING TOPICS...</Text>
        </View>
      </GlowBackground>
    )
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  })

  // Animate button flat shadow offset for tactile click feedback
  const buttonTranslateX = buttonPressVal.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 3]
  })
  
  const buttonShadowWidth = buttonPressVal.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 1]
  })

  return (
    <GlowBackground>
      <View style={styles.container}>
        {/* Flat spacious Header */}
        <View style={styles.header}>
          <Text style={[styles.title, webStyles.title]}>SELECT TOPICS</Text>
          <Text style={styles.subtitle}>Select at least 3 items to personalize your learning companion feed.</Text>

          {/* Simple flat progress tracker */}
          <View style={styles.progressBarWrapper}>
            <View style={styles.progressBarBackground}>
              <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
            </View>
            <Text style={styles.progressText}>
              {selected.length < 3 
                ? `CHOOSE ${3 - selected.length} MORE` 
                : 'MINIMUM TOPICS ALIGNED!'}
            </Text>
          </View>
        </View>

        {/* Interests Grid */}
        <FlatList
          data={interests}
          numColumns={2}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <InterestCard
              item={item}
              isSelected={selected.includes(item.id)}
              onPress={() => toggleInterest(item.id)}
            />
          )}
        />

        {/* Tactile mechanically clickable Continue Button */}
        <View style={styles.buttonFooter}>
          <Animated.View style={{ 
            transform: [
              { translateX: buttonTranslateX },
              { translateY: buttonTranslateX }
            ] 
          }}>
            <TouchableOpacity
              activeOpacity={1}
              style={[
                styles.button, 
                webStyles.button,
                selected.length < 3 && styles.buttonDisabled,
                selected.length < 3 && webStyles.buttonDisabled,
                selected.length >= 3 && styles.buttonActive,
                Platform.OS !== 'web' && selected.length >= 3 && {
                  shadowOffset: { width: buttonShadowWidth, height: buttonShadowWidth }
                }
              ]}
              onPress={saveInterests}
              onPressIn={() => animateButtonPress(1)}
              onPressOut={() => animateButtonPress(0)}
              disabled={saving || selected.length < 3}
            >
              <Text style={[styles.buttonText, selected.length >= 3 && styles.buttonTextActive]}>
                {saving 
                  ? 'LAUNCHING...' 
                  : selected.length < 3 
                    ? `SELECT ${3 - selected.length} MORE` 
                    : `INITIATE EXPLORATION (${selected.length})`}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </GlowBackground>
  )
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#1A1A1A',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  header: { 
    marginTop: 64, 
    marginBottom: 20, 
  },
  title: { 
    fontSize: 20, 
    fontWeight: '900', 
    color: '#1A1A1A', 
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: { 
    fontSize: 13, 
    color: '#666', 
    lineHeight: 18,
    marginBottom: 24 
  },
  progressBarWrapper: {
    gap: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#EAEAEA',
    borderWidth: 1.5,
    borderColor: '#1A1A1A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1A1A1A',
  },
  progressText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1A1A1A',
    letterSpacing: 1.5,
  },
  grid: { 
    paddingBottom: 130, 
  },
  card: {
    flex: 1, 
    margin: 8, 
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#1A1A1A',
    height: 110,
    overflow: 'hidden',
    shadowColor: '#1A1A1A',
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 2,
  },
  cardClickable: {
    flex: 1,
    alignItems: 'center', 
    justifyContent: 'center',
    padding: 16,
    position: 'relative',
  },
  icon: { 
    fontSize: 28, 
    marginBottom: 8,
  },
  iconSelected: {
    transform: [{ scale: 1.1 }],
  },
  cardText: { 
    fontSize: 13, 
    fontWeight: '800', 
    color: '#1A1A1A',
    letterSpacing: 0.5 
  },
  cardTextSelected: { 
    fontWeight: '900',
  },
  selectedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1A1A1A',
  },
  buttonFooter: {
    position: 'absolute', 
    bottom: 36, 
    left: 24, 
    right: 24,
  },
  button: {
    borderRadius: 16, 
    paddingVertical: 18, 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#CCC',
    backgroundColor: '#FAF8F5',
  },
  buttonDisabled: { 
    opacity: 0.6,
  },
  buttonActive: {
    borderColor: '#1A1A1A',
    backgroundColor: '#1A1A1A',
    shadowColor: '#1A1A1A',
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  buttonText: { 
    color: '#999', 
    fontSize: 13, 
    fontWeight: '900',
    letterSpacing: 2 
  },
  buttonTextActive: {
    color: '#FFFFFF',
  },
})
