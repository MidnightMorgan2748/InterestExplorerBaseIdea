import { useState, useEffect, useRef } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Animated, Platform } from 'react-native'
import { supabase } from '../../lib/supabase'
import GlowBackground from '../../components/GlowBackground'

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Focus states
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  // Motion animations
  const cardFade = useRef(new Animated.Value(0)).current
  const cardTranslateY = useRef(new Animated.Value(20)).current
  
  // Tactical button press animation
  const buttonPressVal = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(cardTranslateY, {
        toValue: 0,
        friction: 6,
        tension: 80,
        useNativeDriver: Platform.OS !== 'web',
      })
    ]).start()
  }, [])

  async function handleLogin() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid email', 'Please enter a valid email address')
      return
    }

    if (!password) {
      Alert.alert('Missing password', 'Please enter your password')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        Alert.alert(
          'Email not confirmed',
          'Please check your inbox and click the confirmation link first.'
        )
      } else if (error.message.includes('Invalid login credentials')) {
        Alert.alert(
          'Wrong credentials',
          'Email or password is incorrect. Please try again.'
        )
      } else {
        Alert.alert('Error', error.message)
      }
    }
    setLoading(false)
  }

  const animateButtonPress = (toVal) => {
    Animated.timing(buttonPressVal, {
      toValue: toVal,
      duration: 100,
      useNativeDriver: false, // Animating shadow offsets/layouts
    }).start()
  }

  // Web-only custom style definitions
  const webStyles = {
    card: Platform.OS === 'web' ? {
      boxShadow: '6px 6px 0px #1A1A1A',
    } : {},
    inputWrapperFocused: Platform.OS === 'web' ? {
      boxShadow: '3px 3px 0px #1A1A1A',
    } : {},
    input: Platform.OS === 'web' ? {
      outlineStyle: 'none',
    } : {},
    button: Platform.OS === 'web' ? {
      boxShadow: '4px 4px 0px #1A1A1A',
      transition: 'transform 0.1s ease, box-shadow 0.1s ease',
    } : {},
  }

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
      <View style={styles.outerContainer}>
        <Animated.View style={[
          styles.card, 
          webStyles.card, 
          { 
            opacity: cardFade, 
            transform: [{ translateY: cardTranslateY }] 
          }
        ]}>
          {/* Flat Brand Header */}
          <View style={styles.brandHeader}>
            <Text style={styles.logoIcon}>💡</Text>
            <Text style={styles.title}>INTEREST EXPLORER</Text>
            <Text style={styles.subtitle}>A clean minimal companion to navigate complex fields of knowledge.</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            {/* Input Wrapper Email */}
            <View style={[
              styles.inputWrapper, 
              emailFocused && styles.inputWrapperFocused,
              emailFocused && webStyles.inputWrapperFocused
            ]}>
              <Text style={[styles.inputLabel, emailFocused && styles.inputLabelFocused]}>EMAIL ADDRESS</Text>
              <TextInput
                style={[styles.input, webStyles.input]}
                placeholder="Enter your email address..."
                placeholderTextColor="rgba(26,26,26,0.3)"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>

            {/* Input Wrapper Password */}
            <View style={[
              styles.inputWrapper, 
              passwordFocused && styles.inputWrapperFocused,
              passwordFocused && webStyles.inputWrapperFocused
            ]}>
              <Text style={[styles.inputLabel, passwordFocused && styles.inputLabelFocused]}>PASSWORD</Text>
              <TextInput
                style={[styles.input, webStyles.input]}
                placeholder="Enter your password..."
                placeholderTextColor="rgba(26,26,26,0.3)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
            </View>

            {/* Tactile Mechanical Button */}
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
                  loading && styles.buttonDisabled,
                  Platform.OS !== 'web' && {
                    shadowOffset: { width: buttonShadowWidth, height: buttonShadowWidth }
                  }
                ]}
                onPress={handleLogin}
                onPressIn={() => animateButtonPress(1)}
                onPressOut={() => animateButtonPress(0)}
                disabled={loading}
              >
                <Text style={styles.buttonText}>{loading ? 'LAUNCHING...' : 'ENTER PORTAL'}</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Sign-up Link */}
            <TouchableOpacity 
              style={styles.linkContainer}
              onPress={() => navigation.navigate('Signup')}
            >
              <Text style={styles.linkText}>
                New explorer? <Text style={styles.linkHighlight}>Create an Account</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </GlowBackground>
  )
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 36,
    paddingVertical: 44,
    borderWidth: 2,
    borderColor: '#1A1A1A',
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoIcon: {
    fontSize: 44,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A1A1A',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  form: {
    gap: 18,
  },
  inputWrapper: {
    backgroundColor: '#FAF8F5',
    borderWidth: 2,
    borderColor: '#1A1A1A',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapperFocused: {
    backgroundColor: '#FFFDF9',
    borderColor: '#1A1A1A',
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#888',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  inputLabelFocused: {
    color: '#1A1A1A',
  },
  input: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '600',
    padding: 0,
    height: 22,
  },
  button: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#1A1A1A',
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#1A1A1A',
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  linkContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 13,
    color: '#777',
  },
  linkHighlight: {
    color: '#1A1A1A',
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
})