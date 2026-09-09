import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

export default function App() {
  const [message, setMessage] = useState('');
  const [answer, setAnswer] = useState('');

  const sendMessage = async () => {
    if (message.trim() === '') return;

    try {
      setAnswer('YLM AI düşünüyor...');

      const response = await fetch(
        'https://shiny-parakeet-5vx7jjj7vqv6h7qjj-3000.app.github.dev/chat',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message,
          }),
        }
      );

      const data = await response.json();

      setAnswer(data.reply || 'YLM AI cevap veremedi.');
      setMessage('');
    } catch (error) {
      setAnswer('YLM AI sunucusuna bağlanılamadı.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>YLM AI</Text>

      <Text style={styles.welcome}>Merhaba 👋</Text>

      <Text style={styles.question}>
        Sana nasıl yardımcı olabilirim?
      </Text>

      <ScrollView style={styles.chat}>
        {answer !== '' && (
          <View style={styles.answerBox}>
            <Text style={styles.answer}>{answer}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputBox}>
        <TextInput
          style={styles.input}
          placeholder="Bir şey yaz..."
          placeholderTextColor="#888"
          value={message}
          onChangeText={setMessage}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={sendMessage}
        >
          <Text style={styles.buttonText}>➤</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.info}>
        YLM AI senin kişisel yapay zekâ asistanın.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
    padding: 25,
    justifyContent: 'center',
  },

  logo: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 60,
  },

  welcome: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  question: {
    color: '#aaaaaa',
    fontSize: 18,
    marginBottom: 20,
  },

  chat: {
    maxHeight: 250,
    marginBottom: 20,
  },

  answerBox: {
    backgroundColor: '#181818',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },

  answer: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
  },

  inputBox: {
    height: 60,
    backgroundColor: '#181818',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#333333',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 15,
    paddingRight: 6,
  },

  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
  },

  button: {
    width: 48,
    height: 48,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonText: {
    color: '#000000',
    fontSize: 24,
    fontWeight: 'bold',
  },

  info: {
    color: '#666666',
    textAlign: 'center',
    marginTop: 25,
    fontSize: 13,
  },
});