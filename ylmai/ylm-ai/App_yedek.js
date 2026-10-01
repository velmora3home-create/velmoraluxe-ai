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
} from 'react-native';

const SERVER_URL =
  'https://shiny-parakeet-5vx7jjj7vqv6h7qjj-3000.app.github.dev/chat';

export default function App() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef(null);
  useEffect(() => { const l=Keyboard.addListener('keyboardDidShow',()=>setTimeout(()=>scrollViewRef.current?.scrollToEnd({animated:true}),100)); return ()=>l.remove(); }, []);

  const sendMessage = async () => {
    const text = message.trim();

    if (!text || loading) return;

    setMessages((prev) => [
      ...prev,
      { role: 'user', text: text },
    ]);

    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(SERVER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
        }),
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'android' ? 'height' : 'padding'}
    >
      <View style={styles.header}>
        <Text style={styles.logo}>YLM AI</Text>
        <Text style={styles.status}>● Çevrimiçi</Text>
      </View>

      {messages.length === 0 ? (
        <View style={styles.welcomeArea}>
          <Text style={styles.welcome}>Merhaba 👋</Text>
          <Text style={styles.question}>
            Bugün sana nasıl yardımcı olabilirim?
          </Text>

          <View style={styles.quickGrid}>
            <View style={styles.quickBox}>
              <Text style={styles.quickIcon}>✍️</Text>
              <Text style={styles.quickText}>Metin yaz</Text>
            </View>

            <View style={styles.quickBox}>
              <Text style={styles.quickIcon}>💡</Text>
              <Text style={styles.quickText}>Fikir bul</Text>
            </View>

            <View style={styles.quickBox}>
              <Text style={styles.quickIcon}>📷</Text>
              <Text style={styles.quickText}>Fotoğraf</Text>
            </View>

            <View style={styles.quickBox}>
              <Text style={styles.quickIcon}>📄</Text>
              <Text style={styles.quickText}>Dosya</Text>
            </View>
          </View>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.chat}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({animated:false})}
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
            <View style={styles.messageRow}>
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
        <TextInput
          style={styles.input}
          placeholder="YLM AI'ye bir şey sor..."
          placeholderTextColor="#777"
          value={message}
          onChangeText={setMessage}
          multiline
        />

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
    backgroundColor: '#05070B',
    paddingHorizontal: 18,
    paddingTop: 45,
    paddingBottom: 15,
  },

  header: {
    alignItems: 'center',
    marginBottom: 20,
  },

  logo: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 2,
  },

  status: {
    color: '#20A4FF',
    fontSize: 12,
    marginTop: 5,
  },

  welcomeArea: {
    flex: 1,
    justifyContent: 'center',
  },

  welcome: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '800',
    marginBottom: 8,
  },

  question: {
    color: '#8E99A8',
    fontSize: 18,
    marginBottom: 30,
  },

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  quickBox: {
    width: '48%',
    backgroundColor: '#0D1118',
    borderWidth: 1,
    borderColor: '#17283A',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
  },

  quickIcon: {
    fontSize: 24,
    marginBottom: 8,
  },

  quickText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
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
    backgroundColor: '#10151D',
    borderWidth: 1,
    borderColor: '#1D2B3A',
    borderBottomLeftRadius: 5,
  },

  messageText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 23,
  },

  thinking: {
    color: '#20A4FF',
    fontSize: 15,
  },

  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#0D1118',
    borderWidth: 1,
    borderColor: '#243548',
    borderRadius: 20,
    paddingLeft: 16,
    paddingRight: 7,
    paddingVertical: 7,
    minHeight: 60,
  },

  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    maxHeight: 110,
    paddingTop: 10,
    paddingBottom: 10,
  },

  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#087EFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  sendButtonDisabled: {
    opacity: 0.35,
  },

  sendText: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800',
  },

  footer: {
    color: '#46515E',
    textAlign: 'center',
    fontSize: 11,
    marginTop: 12,
  },
});