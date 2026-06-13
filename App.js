import { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { supabase } from './lib/supabase'
import LoginScreen from './screens/auth/LoginScreen'
import SignupScreen from './screens/auth/SignupScreen'
import InterestPickerScreen from './screens/onboarding/InterestPickerScreen'
import ChatScreen from './screens/ChatScreen'
import { View, ActivityIndicator, Text, StyleSheet, Platform } from 'react-native'

const Stack = createNativeStackNavigator()

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasInterests, setHasInterests] = useState(false)

  const isEnvMissing = !process.env.EXPO_PUBLIC_SUPABASE_URL || 
                       !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
                       !process.env.EXPO_PUBLIC_GROQ_API_KEY;

  useEffect(() => {
    if (isEnvMissing) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session) {
        await checkInterests(session.user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        if (session) {
          await checkInterests(session.user.id)
        } else {
          setHasInterests(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function checkInterests(userId) {
    if (isEnvMissing) return
    const { data } = await supabase
      .from('user_interests')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
    setHasInterests(data && data.length > 0)
  }

  if (isEnvMissing) {
    return <EnvWarningScreen />
  }

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#070514' }}>
      <ActivityIndicator size="large" color="#a855f7" />
    </View>
  )

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : !hasInterests ? (
          <Stack.Screen name="InterestPicker">
            {props => (
              <InterestPickerScreen
                {...props}
                onInterestsSaved={() => setHasInterests(true)}
              />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Chat" component={ChatScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

function EnvWarningScreen() {
  const missingVars = []
  if (!process.env.EXPO_PUBLIC_SUPABASE_URL) missingVars.push('EXPO_PUBLIC_SUPABASE_URL')
  if (!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) missingVars.push('EXPO_PUBLIC_SUPABASE_ANON_KEY')
  if (!process.env.EXPO_PUBLIC_GROQ_API_KEY) missingVars.push('EXPO_PUBLIC_GROQ_API_KEY')

  return (
    <View style={envStyles.container}>
      <View style={envStyles.card}>
        <Text style={envStyles.emoji}>⚠️</Text>
        <Text style={envStyles.title}>CONFIGURATION REQUIRED</Text>
        <Text style={envStyles.subtitle}>
          The application is missing crucial environment variables. Please set them up to launch the portal.
        </Text>
        
        <View style={envStyles.list}>
          <Text style={envStyles.listHeader}>MISSING KEYS:</Text>
          {missingVars.map(v => (
            <View key={v} style={envStyles.listItem}>
              <Text style={envStyles.listItemText}>• {v}</Text>
            </View>
          ))}
        </View>

        <View style={envStyles.instructions}>
          <Text style={envStyles.instructionTitle}>HOW TO SOLVE:</Text>
          <Text style={envStyles.instructionText}>
            1. Copy <Text style={envStyles.code}>.env.example</Text> to a new file named <Text style={envStyles.code}>.env</Text> in the project root.
          </Text>
          <Text style={envStyles.instructionText}>
            2. Open <Text style={envStyles.code}>.env</Text> and fill in your Supabase & Groq API credentials.
          </Text>
          <Text style={envStyles.instructionText}>
            3. Restart Metro bundler using:
          </Text>
          <View style={envStyles.codeBlock}>
            <Text style={envStyles.codeBlockText}>npm start -- --clear</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

const envStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#1A1A1A',
    padding: 32,
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  emoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
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
    marginBottom: 24,
  },
  list: {
    backgroundColor: '#FFF5CC',
    borderWidth: 2,
    borderColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  listHeader: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1A1A1A',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  listItem: {
    marginBottom: 4,
  },
  listItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  instructions: {
    gap: 8,
  },
  instructionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1A1A1A',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
    fontWeight: '600',
  },
  code: {
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#1A1A1A',
    backgroundColor: '#EAEAEA',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  codeBlock: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  codeBlockText: {
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
})