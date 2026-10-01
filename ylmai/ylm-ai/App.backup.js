import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Image,
} from 'react-native';

const SERVER_URL =
  'https://shiny-parakeet-5vx7jjj7vqv6h7qjj-3000.app.github.dev/chat';

const pictures = [
  'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?w=400',
  'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400',
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=400',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
];

export default function App() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    const listener = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => listener.remove();
  }, []);

  const sendMessage = async () => {
    const text = message.trim();

    if (!text || loading) return;

    setMessages((prev) => [
      ...prev,
      { role: 'user', text },
    ]);

    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(SERVER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: data.reply || 'YLM AI cevap veremedi.',
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: 'YLM AI sunucusuna bağlanılamadı.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const HomeScreen = () => (
    <View style={styles.home}>
      <View style={styles.topButtons}>
        <TouchableOpacity style={styles.circleButton} onPress={() => setChatOpen(true)}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.circleButton}>
          <Text style={styles.chatIcon}>◔</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.announcement}>
        <Text style={styles.announcementTitle}>
          Görsel oluşturma büyük
        </Text>
        <Text style={styles.announcementTitle}>
          bir güncelleme aldı
        </Text>
        <Text style={styles.announcementSub}>
          Daha kaliteli sonuçlar, daha hızlı oluşturma
        </Text>
        <Text style={styles.announcementSub}>
          ve daha akıllı yaratıcı araçlar
        </Text>
      </View>

      <View style={styles.pictureRow}>
        {pictures.map((uri, index) => (
          <Image
            key={index}
            source={{ uri }}
            style={[
              styles.picture,
              index === 0 && styles.pictureLeft,
              index === 4 && styles.pictureRight,
            ]}
          />
        ))}
      </View>

      <View style={styles.orbGlow}>
        <View style={styles.orb}>
          <Text style={styles.orbText}>
            YLM <Text style={styles.orbBlue}>AI</Text>
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'android' ? 'height' : 'padding'}
    >
      {messages.length === 0 ? (
        <HomeScreen />
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.chat}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: false })
          }
        >
          {messages.map((item, index) => (
            <View
              key={index}
              style={[
                styles.messageRow,
                item.role === 'user'
                  ? styles.userRow
                  : styles.aiRow,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  item.role === 'user'
                    ? styles.userBubble
                    : styles.aiBubble,
                ]}
              >
                <Text style={styles.messageText}>
                  {item.text}
                </Text>
              </View>
            </View>
          ))}

          {loading && (
            <View style={styles.aiRow}>
              <View style={styles.aiBubble}>
                <Text style={styles.thinking}>
                  YLM AI düşünüyor...
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      <View style={styles.inputArea}>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addText}>＋</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="YLM AI'ye bir şey sor..."
          placeholderTextColor="#687384"
          value={message}
          onChangeText={setMessage}
          multiline
        />

        <TouchableOpacity style={styles.micButton}>
          <Text style={styles.micText}>🎙</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!message.trim() || loading) &&
              styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!message.trim() || loading}
        >
          <Text style={styles.sendText}>➤</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        YLM AI • Senin yapay zekâ asistanın
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#03070D',
    paddingHorizontal: 18,
    paddingTop: 42,
    paddingBottom: 14,
  },

  home: {
    flex: 1,
  },

  topButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  circleButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#08111D',
    borderWidth: 1,
    borderColor: '#1C344F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuIcon: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '300',
  },

  chatIcon: {
    color: '#FFFFFF',
    fontSize: 32,
  },

  announcement: {
    alignItems: 'center',
    marginTop: 70,
    zIndex: 2,
  },

  announcementTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 31,
  },

  announcementSub: {
    color: '#AAB6C8',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
  },

  pictureRow: {
    height: 135,
    marginTop: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: -30,
  },

  picture: {
    width: 100,
    height: 100,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#5AAEFF',
    transform: [{ rotate: '5deg' }],
  },

  pictureLeft: {
    transform: [{ rotate: '-10deg' }],
  },

  pictureRight: {
    transform: [{ rotate: '10deg' }],
  },

  orbGlow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  orb: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#06152B',
    borderWidth: 3,
    borderColor: '#168BFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#087EFF',
    shadowOpacity: 0.9,
    shadowRadius: 35,
    shadowOffset: { width: 0, height: 0 },
    elevation: 20,
  },

  orbText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1,
  },

  orbBlue: {
    color: '#39A2FF',
  },

  chat: {
    flex: 1,
  },

  chatContent: {
    paddingVertical: 10,
  },

  messageRow: {
    width: '100%',
    marginBottom: 12,
  },

  userRow: {
    alignItems: 'flex-end',
  },

  aiRow: {
    alignItems: 'flex-start',
  },

  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 18,
  },

  userBubble: {
    backgroundColor: '#087EFF',
    borderBottomRightRadius: 5,
  },

  aiBubble: {
    backgroundColor: '#101722',
    borderWidth: 1,
    borderColor: '#20344A',
    borderBottomLeftRadius: 5,
  },

  messageText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 23,
  },

  thinking: {
    color: '#38A2FF',
    fontSize: 15,
  },

  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#07101B',
    borderWidth: 1,
    borderColor: '#23415F',
    borderRadius: 32,
    paddingLeft: 8,
    paddingRight: 7,
    paddingVertical: 7,
    minHeight: 64,
  },

  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0B1B2F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '300',
  },

  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },

  micButton: {
    width: 42,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },

  micText: {
    fontSize: 22,
  },

  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#087EFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sendButtonDisabled: {
    opacity: 0.35,
  },

  sendText: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
  },

  footer: {
    color: '#465568',
    textAlign: 'center',
    fontSize: 11,
    marginTop: 11,
  },
});
