import { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { supabase } from './lib/supabase'
import LoginScreen from './screens/auth/LoginScreen'
import SignupScreen from './screens/auth/SignupScreen'
import InterestPickerScreen from './screens/onboarding/InterestPickerScreen'
import ChatScreen from './screens/ChatScreen'
import { View, ActivityIndicator } from 'react-native'

const Stack = createNativeStackNavigator()

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasInterests, setHasInterests] = useState(false)

  useEffect(() => {
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
    const { data } = await supabase
      .from('user_interests')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
    setHasInterests(data && data.length > 0)
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