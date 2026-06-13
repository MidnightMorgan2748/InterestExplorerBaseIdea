import { useState, useEffect, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Animated
} from 'react-native'
import { supabase } from '../lib/supabase'
import GlowBackground from '../components/GlowBackground'

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

// Safe Web-only custom style definitions
const webStyles = {
  header: Platform.OS === 'web' ? {
    borderBottomWidth: '2px',
  } : {},
  headerBtn: Platform.OS === 'web' ? {
    transition: 'transform 0.15s ease',
  } : {},
  userBubble: Platform.OS === 'web' ? {
    boxShadow: '3px 3px 0px #1A1A1A',
  } : {},
  aiBubble: Platform.OS === 'web' ? {
    boxShadow: '3px 3px 0px #1A1A1A',
  } : {},
  curiosityBubble: Platform.OS === 'web' ? {
    boxShadow: '4px 4px 0px #1A1A1A',
  } : {},
  bookmarkBtn: Platform.OS === 'web' ? {
    transition: 'all 0.15s ease',
  } : {},
  inputRow: Platform.OS === 'web' ? {
    boxShadow: '4px 4px 0px #1A1A1A',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  } : {},
  inputRowFocused: Platform.OS === 'web' ? {
    boxShadow: '2px 2px 0px #1A1A1A',
  } : {},
  input: Platform.OS === 'web' ? {
    outlineStyle: 'none',
  } : {},
  sendButtonActive: Platform.OS === 'web' ? {
    boxShadow: '2px 2px 0px #1A1A1A',
  } : {}
}

// Minimal bouncing star loading animation
function SequentialStarLoader() {
  const star1 = useRef(new Animated.Value(0)).current
  const star2 = useRef(new Animated.Value(0)).current
  const star3 = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const createBouncingStar = (animVal, startDelay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(startDelay),
          Animated.timing(animVal, {
            toValue: -6,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(animVal, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(600)
        ])
      )
    }

    Animated.parallel([
      createBouncingStar(star1, 0),
      createBouncingStar(star2, 120),
      createBouncingStar(star3, 240)
    ]).start()
  }, [])

  return (
    <View style={styles.loaderContainer}>
      <Animated.Text style={[styles.loaderStar, { transform: [{ translateY: star1 }] }]}>✦</Animated.Text>
      <Animated.Text style={[styles.loaderStar, { transform: [{ translateY: star2 }] }]}>✦</Animated.Text>
      <Animated.Text style={[styles.loaderStar, { transform: [{ translateY: star3 }] }]}>✦</Animated.Text>
      <Text style={styles.loaderText}>CONNECTING CONSTELLATIONS...</Text>
    </View>
  )
}

export default function ChatScreen({ navigation }) {
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      text: "Welcome back! 🚀 I'm your curiosity companion. What concepts or dimensions of knowledge should we navigate today?",
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [userInterests, setUserInterests] = useState([])
  const [messageCount, setMessageCount] = useState(0)
  const [bookmarks, setBookmarks] = useState([])
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const flatListRef = useRef()

  const listFade = useRef(new Animated.Value(0)).current

  useEffect(() => {
    fetchUserInterests()
    fetchBookmarks()
    Animated.timing(listFade, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start()
  }, [])

  async function fetchUserInterests() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('user_interests')
      .select('interests(name)')
      .eq('user_id', user.id)
    if (data) {
      const names = data.map(d => d.interests?.name).filter(Boolean)
      setUserInterests(names)
    }
  }

  async function fetchBookmarks() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setBookmarks(data)
  }

  async function bookmarkMessage(message) {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('bookmarks').insert({
      user_id: user.id,
      content: message.text,
      type: message.role
    })
    if (error) {
      Alert.alert('Error', error.message)
    } else {
      Alert.alert('Spark Saved!', 'Insight collected successfully in your Curiosity Journal.')
      fetchBookmarks()
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  function getRandomOtherInterest(currentTopic) {
    const others = userInterests.filter(i =>
      !currentTopic.toLowerCase().includes(i.toLowerCase())
    )
    return others[Math.floor(Math.random() * others.length)]
  }

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMessage = { id: Date.now().toString(), role: 'user', text: input }
    const currentInput = input
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    const newCount = messageCount + 1
    setMessageCount(newCount)

    try {
      const history = messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.text
      }))
      history.push({ role: 'user', content: currentInput })

      const response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: `You are a friendly and engaging learning companion. 
              Teach concepts clearly and concisely. 
              Keep responses under 150 words. 
              Use simple language and examples.
              The user's interests are: ${userInterests.join(', ')}.`
            },
            ...history
          ],
          max_tokens: 300,
        })
      })

      const data = await response.json()
      const aiReply = data.choices[0].message.content

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: aiReply
      }])

      if (newCount % 5 === 0 && userInterests.length > 1) {
        const otherInterest = getRandomOtherInterest(currentInput)
        if (otherInterest) {
          setTimeout(() => injectCuriosity(otherInterest, currentInput), 1500)
        }
      }

    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: 'The celestial nodes are temporarily misaligned. Please try broadcasting your signal again.'
      }])
    }

    setLoading(false)
  }

  async function injectCuriosity(otherInterest, currentTopic) {
    try {
      const response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'user',
              content: `Give me one fascinating connection between "${currentTopic}" and "${otherInterest}" in exactly one sentence. Start with "💡 Did you know:"`
            }
          ],
          max_tokens: 80,
        })
      })

      const data = await response.json()
      const fact = data.choices[0].message.content

      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        role: 'curiosity',
        text: fact
      }])
    } catch (e) {
      console.log('Curiosity injection failed', e)
    }
  }

  function renderMessage({ item }) {
    const isUser = item.role === 'user'
    const isCuriosity = item.role === 'curiosity'

    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userAlign : isCuriosity ? styles.curiosityAlign : styles.aiAlign
      ]}>
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : isCuriosity ? styles.curiosityBubble : styles.aiBubble,
          isUser ? webStyles.userBubble : isCuriosity ? webStyles.curiosityBubble : webStyles.aiBubble
        ]}>
          {isCuriosity && (
            <View style={styles.curiosityHeader}>
              <Text style={styles.curiosityBadge}>💡 CURIOSITY MEMO</Text>
            </View>
          )}

          {!isUser && !isCuriosity && (
            <View style={styles.aiHeader}>
              <Text style={styles.aiBadge}>🤖 COMPANION</Text>
            </View>
          )}

          <Text style={[
            styles.messageText,
            isUser ? styles.userText : isCuriosity ? styles.curiosityText : styles.aiText
          ]}>
            {item.text}
          </Text>

          {!isUser && (
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.bookmarkBtn}
              onPress={() => bookmarkMessage(item)}
            >
              <Text style={styles.bookmarkBtnText}>✦ COLLECT SPARK</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    )
  }

  function renderBookmark({ item }) {
    const isCuriosity = item.type === 'curiosity'
    return (
      <View style={[
        styles.bookmarkCard,
        isCuriosity ? styles.bookmarkCardCuriosity : styles.bookmarkCardAi
      ]}>
        <Text style={styles.bookmarkType}>
          {isCuriosity ? '✨ CURIOSITY INSIGHT' : '🤖 COMPANION LOG'}
        </Text>
        <Text style={styles.bookmarkContent}>{item.content}</Text>
      </View>
    )
  }

  if (showBookmarks) {
    return (
      <GlowBackground>
        <View style={styles.container}>
          {/* Flat header for Bookmarks */}
          <View style={[styles.header, webStyles.header]}>
            <TouchableOpacity 
              activeOpacity={0.8}
              style={styles.backBtnWrapper}
              onPress={() => setShowBookmarks(false)}
            >
              <Text style={styles.backBtn}>← DEPART JOURNAL</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>SPARK ARCHIVE</Text>
            <View style={{ width: 40 }} />
          </View>

          {bookmarks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🪐</Text>
              <Text style={styles.emptyText}>YOUR ARCHIVE IS EMPTY</Text>
              <Text style={styles.emptySubtext}>Collect interesting facts from your chat by tapping ✦ COLLECT SPARK.</Text>
            </View>
          ) : (
            <FlatList
              data={bookmarks}
              keyExtractor={item => item.id.toString()}
              renderItem={renderBookmark}
              contentContainerStyle={styles.bookmarkList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </GlowBackground>
    )
  }

  return (
    <GlowBackground>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Flat Minimal Constellation Header */}
        <View style={[styles.header, webStyles.header]}>
          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, webStyles.headerTitle]}>NEURAL SPACE</Text>
            <ScrollViewHorizontalFallback userInterests={userInterests} />
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.headerBtn, webStyles.headerBtn]}
              onPress={() => setShowBookmarks(true)}
            >
              <Text style={styles.headerBtnText}>📖</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.headerBtn, webStyles.headerBtn]}
              onPress={handleLogout}
            >
              <Text style={styles.headerBtnText}>🚪</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Messaging Feed */}
        <Animated.View style={{ flex: 1, opacity: listFade }}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        </Animated.View>

        {/* Pulsating Sequential Star loading */}
        {loading && <SequentialStarLoader />}

        {/* Flat Floating Input Bar */}
        <View style={styles.footerContainer}>
          <View style={[
            styles.inputRow, 
            inputFocused && styles.inputRowFocused,
            webStyles.inputRow,
            inputFocused && webStyles.inputRowFocused
          ]}>
            <TextInput
              style={[styles.input, webStyles.input]}
              value={input}
              onChangeText={setInput}
              placeholder="Query the explorer..."
              placeholderTextColor="rgba(26,26,26,0.3)"
              multiline
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.sendButton,
                !input.trim() && styles.sendButtonDisabled,
                input.trim() && styles.sendButtonActive,
                input.trim() && webStyles.sendButtonActive
              ]}
              onPress={sendMessage}
              disabled={!input.trim() || loading}
            >
              <Text style={styles.sendButtonText}>▲</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </GlowBackground>
  )
}

function ScrollViewHorizontalFallback({ userInterests }) {
  return (
    <View style={styles.chipsContainer}>
      {userInterests.map((interest, idx) => (
        <View key={idx} style={styles.chip}>
          <Text style={styles.chipText}>{interest.toUpperCase()}</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60, 
    paddingBottom: 20,
    paddingHorizontal: 24, 
    flexDirection: 'row',
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderBottomWidth: 2,
    borderColor: '#1A1A1A',
  },
  headerInfo: {
    flex: 1,
    gap: 8,
  },
  headerTitle: { 
    color: '#1A1A1A', 
    fontSize: 16, 
    fontWeight: '900',
    letterSpacing: 2,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1.5,
    borderColor: '#1A1A1A',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: {
    color: '#1A1A1A',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerButtons: { 
    flexDirection: 'row', 
    gap: 12 
  },
  headerBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#1A1A1A',
    borderRadius: 14, 
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  headerBtnText: { 
    fontSize: 16 
  },
  backBtnWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: { 
    color: '#1A1A1A', 
    fontSize: 10, 
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  messageList: { 
    padding: 24, 
    paddingBottom: 40 
  },
  messageContainer: {
    width: '100%',
    marginBottom: 20,
  },
  userAlign: {
    alignItems: 'flex-end',
  },
  aiAlign: {
    alignItems: 'flex-start',
  },
  curiosityAlign: {
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: '85%', 
    borderRadius: 20, 
    paddingHorizontal: 18, 
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#1A1A1A',
    shadowColor: '#1A1A1A',
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 1,
  },
  userBubble: { 
    backgroundColor: '#1A1A1A', 
    borderColor: '#1A1A1A',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#FFFFFF', 
    borderColor: '#1A1A1A',
    borderBottomLeftRadius: 4,
  },
  aiHeader: {
    marginBottom: 4,
  },
  aiBadge: {
    fontSize: 8,
    fontWeight: '900',
    color: '#777',
    letterSpacing: 1.5,
  },
  curiosityBubble: {
    backgroundColor: '#FFF5CC', // Flat post-it style yellow
    borderColor: '#1A1A1A',
    width: '100%', 
    borderRadius: 18,
    borderWidth: 2,
  },
  curiosityHeader: { 
    marginBottom: 4,
    alignItems: 'center',
  },
  curiosityBadge: { 
    fontSize: 9, 
    fontWeight: '900', 
    color: '#1A1A1A', 
    letterSpacing: 1.5,
  },
  messageText: { 
    fontSize: 14, 
    lineHeight: 22,
    fontWeight: '600',
  },
  userText: { 
    color: '#FFFFFF',
  },
  aiText: { 
    color: '#1A1A1A',
  },
  curiosityText: { 
    color: '#1A1A1A', 
    textAlign: 'center',
    fontStyle: 'italic',
    fontSize: 15,
  },
  bookmarkBtn: { 
    marginTop: 10, 
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#1A1A1A',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  bookmarkBtnText: { 
    fontSize: 9, 
    color: '#1A1A1A',
    fontWeight: '900',
    letterSpacing: 1,
  },
  loaderContainer: {
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16, 
    gap: 6,
  },
  loaderStar: {
    fontSize: 12,
    color: '#1A1A1A',
  },
  loaderText: { 
    color: '#1A1A1A', 
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    marginLeft: 4,
  },
  footerContainer: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 12,
    backgroundColor: 'transparent',
  },
  inputRow: {
    flexDirection: 'row', 
    padding: 8, 
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#1A1A1A',
    gap: 12, 
    alignItems: 'center',
    shadowColor: '#1A1A1A',
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 2,
  },
  inputRowFocused: {
    backgroundColor: '#FFFDF9',
  },
  input: {
    flex: 1, 
    color: '#1A1A1A',
    fontSize: 14, 
    fontWeight: '600',
    paddingHorizontal: 12, 
    paddingVertical: 8,
    maxHeight: 120,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#CCC',
    backgroundColor: '#FAF8F5',
  },
  sendButtonDisabled: { 
    opacity: 0.6,
  },
  sendButtonActive: {
    borderColor: '#1A1A1A',
    backgroundColor: '#1A1A1A',
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  sendButtonText: { 
    color: '#FFFFFF', 
    fontWeight: '900',
    fontSize: 14,
  },
  bookmarkList: {
    padding: 24,
    paddingBottom: 60,
  },
  bookmarkCard: {
    backgroundColor: '#FFFFFF', 
    borderRadius: 18, 
    padding: 20,
    marginBottom: 16, 
    borderLeftWidth: 4, 
    borderWidth: 2,
    borderColor: '#1A1A1A',
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  bookmarkCardCuriosity: {
    borderLeftColor: '#F4D35E',
    backgroundColor: '#FFFDF0',
  },
  bookmarkCardAi: {
    borderLeftColor: '#1A1A1A',
  },
  bookmarkType: { 
    fontSize: 9, 
    fontWeight: '900', 
    marginBottom: 8,
    letterSpacing: 1.5,
    color: '#777',
  },
  bookmarkContent: { 
    fontSize: 13, 
    color: '#1A1A1A', 
    lineHeight: 20,
    fontWeight: '600',
  },
  emptyState: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyText: { 
    fontSize: 13, 
    fontWeight: '900', 
    color: '#1A1A1A', 
    letterSpacing: 2,
    textAlign: 'center',
  },
  emptySubtext: { 
    fontSize: 12, 
    color: '#777', 
    textAlign: 'center', 
    lineHeight: 18,
    paddingHorizontal: 20,
  },
})