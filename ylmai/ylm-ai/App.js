import React, { useEffect, useRef, useState } from 'react';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
// Expo Go uyumluluğu için ses tanıma geçici olarak devre dışı
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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
  useEffect(() => {
  }, []);


  
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useSpeechRecognitionEvent("result", (event) => {
    const transcript = event.results?.[0]?.transcript || "";
    if (transcript) setMessage(transcript);
  });

  useSpeechRecognitionEvent("end", () => {
    setIsRecording(false);
  });

  useSpeechRecognitionEvent("error", (event) => {
    console.log("YLM AI konuşma hatası:", event.error);
    setIsRecording(false);
  });

  const toggleRecording = async () => {
    if (isRecording) {
      ExpoSpeechRecognitionModule.stop();
      setIsRecording(false);
      return;
    }

    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Mikrofon izni", "YLM AI'nin mikrofonu kullanabilmesi için izin vermen gerekiyor.");
      return;
    }

    try {
      setIsRecording(true);
      ExpoSpeechRecognitionModule.start({
        lang: "tr-TR",
        interimResults: true,
        continuous: false,
      });
    } catch (error) {
      console.log("YLM AI mikrofon başlatma hatası:", error);
      setIsRecording(false);
    }
  };

  useEffect(() => {
    AsyncStorage.getItem("ylm_chat_history").then((saved) => {
      if (saved) setChatHistory(JSON.parse(saved));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    AsyncStorage.setItem("ylm_chat_history", JSON.stringify(chatHistory)).catch(() => {});
  }, [chatHistory]);

  useEffect(() => {
    AsyncStorage.multiGet(["ylm_is_pro", "ylm_daily_count", "ylm_bonus_messages", "ylm_message_date"]).then((items) => {
      const data = Object.fromEntries(items);
      const today = new Date().toISOString().slice(0, 10);
      setIsPro(data.ylm_is_pro === "true");
      setBonusMessages(Number(data.ylm_bonus_messages || 0));
      if (data.ylm_message_date === today) {
        setDailyMessageCount(Number(data.ylm_daily_count || 0));
        setMessageDate(today);
      } else {
        setDailyMessageCount(0);
        setMessageDate(today);
        AsyncStorage.multiSet([["ylm_daily_count", "0"], ["ylm_message_date", today]]).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (chatOpen) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, chatOpen]);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (chatOpen) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, chatOpen]);



  const sendMessage = async () => {
    const text = message.trim();

    if (!isPro && dailyMessageCount >= 5 && bonusMessages <= 0) {
      Alert.alert(
        "Günlük mesaj limitin doldu",
        "Ücretsiz 5 mesaj hakkını kullandın. Reklam izleyerek +5 mesaj kazanabilir veya YLM AI Proya geçebilirsin.",
        [
          { text: "Daha sonra", style: "cancel" },
          
          { text: "YLM AI Pro", onPress: () => setProOpen(true) }
        ]
      );
      return;
    }

    if (!text || loading) return;

    setChatOpen(true);
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setMessage('');
    setLoading(true);

    try {
      let fileData = null;
      if (selectedFile?.uri) {
        const base64 = await FileSystem.readAsStringAsync(
          selectedFile.uri,
          { encoding: FileSystem.EncodingType.Base64 }
        );
        fileData = {
          name: selectedFile.name || "dosya",
          data: `data:${selectedFile.mimeType || "application/octet-stream"};base64,${base64}`
        };
      }

      const response = await fetch(SERVER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text, history: messages.map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: [{ type: "input_text", text: m.text || "" }] })), image: selectedImage?.base64 ? "data:image/jpeg;base64," + selectedImage.base64 : null, file: fileData, generateImage: /görsel oluştur|resim oluştur|bir resim yap|bir görsel yap|çiz|çizimini yap/i.test(text) }),
      });

      const data = await response.json();
      if (!isPro) {
        if (bonusMessages > 0) {
          const nextBonus = bonusMessages - 1;
          setBonusMessages(nextBonus);
          AsyncStorage.setItem("ylm_bonus_messages", String(nextBonus)).catch(() => {});
        } else {
          const nextCount = dailyMessageCount + 1;
          const today = new Date().toISOString().slice(0, 10);
          setDailyMessageCount(nextCount);
          setMessageDate(today);
          AsyncStorage.multiSet([
            ["ylm_daily_count", String(nextCount)],
            ["ylm_message_date", today]
          ]).catch(() => {});
        }
      }



      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: data.reply || (data.image ? 'Görsel oluşturuldu.' : 'YLM AI cevap veremedi.'),
        image: data.image || null,
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

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'text/plain'], copyToCacheDirectory: true });
    if (result.canceled === false && result.assets && result.assets[0]) {
      setSelectedFile(result.assets[0]);
      setChatOpen(true);
    }
  };

  const openAttachmentMenu = () => { Alert.alert("YLM AI", "Ne eklemek istiyorsun?", [{ text: "Fotoğraf", onPress: pickImage }, { text: "Dosya / PDF", onPress: pickFile }, { text: "İptal", style: "cancel" }]); };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      setSelectedImage(result.assets[0]);
      setChatOpen(true);
    }
  };

  const newChat = () => {
    setMessages([]);
    setMessage('');
    setLoading(false);
    setChatOpen(false);
  };

  if (chatOpen) {
    if (proOpen) {
    return (
      <View style={styles.container}>
        <View style={{ paddingTop: 55, paddingHorizontal: 20 }}>
          <TouchableOpacity onPress={() => setProOpen(false)}>
            <Text style={{ color: "#fff", fontSize: 30 }}>‹</Text>
          </TouchableOpacity>

          <Text style={{ color: "#fff", fontSize: 30, fontWeight: "800", marginTop: 20 }}>
            ⭐ YLM AI Pro
          </Text>

          <Text style={{ color: "#9fb3c8", fontSize: 16, marginTop: 8, lineHeight: 23 }}>
            YLM AI'yi daha güçlü ve sınırsız kullan.
          </Text>

          <View style={{ marginTop: 30 }}>
            <Text style={{ color: "#fff", fontSize: 17, marginBottom: 14 }}>✓ Reklamsız kullanım</Text>
            <Text style={{ color: "#fff", fontSize: 17, marginBottom: 14 }}>✓ Çok daha yüksek mesaj hakkı</Text>
            <Text style={{ color: "#fff", fontSize: 17, marginBottom: 14 }}>✓ Gelişmiş görsel özellikleri</Text>
            <Text style={{ color: "#fff", fontSize: 17, marginBottom: 14 }}>✓ Gelişmiş dosya özellikleri</Text>
          </View>

          <View style={{ marginTop: 25 }}>
            {[
              ["Aylık", "249 TL / ay"],
              ["5 Aylık", "999 TL / 5 ay"],
              ["Yıllık", "1.999 TL / yıl"],
            ].map(([title, price]) => (
              <TouchableOpacity
                key={title}
                onPress={() => {
                  setIsPro(true);
                  AsyncStorage.setItem("ylm_is_pro", "true");
                  Alert.alert("⭐ Pro aktif", "YLM AI Pro test olarak aktif edildi.");
                  setProOpen(false);
                }}
                style={{
                  backgroundColor: "#18283a",
                  borderWidth: 1,
                  borderColor: "#315b85",
                  borderRadius: 16,
                  padding: 17,
                  marginBottom: 12
                }}
              >
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>{title}</Text>
                <Text style={{ color: "#4da3ff", fontSize: 20, fontWeight: "800", marginTop: 4 }}>{price}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  }

  return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.chatHeader}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setChatOpen(false)}
          >
            <Text style={styles.headerButtonText}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.chatTitle}>YLM AI</Text>

          <TouchableOpacity style={styles.headerButton} onPress={newChat}>
            <Text style={styles.headerButtonText}>＋</Text>
          </TouchableOpacity>
        </View>

        {historyOpen && (
        <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "78%", backgroundColor: "#0b1119", zIndex: 20, paddingTop: 55, paddingHorizontal: 18, borderRightWidth: 1, borderRightColor: "#243447" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 25 }}>
            <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800" }}>Sohbet geçmişi</Text>
            <TouchableOpacity onPress={() => setHistoryOpen(false)}>
              <Text style={{ color: "#fff", fontSize: 28 }}>×</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={newChat}
            style={{ backgroundColor: "#147cff", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 20 }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>＋ Yeni sohbet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setProOpen(true)}>
            style={{
              backgroundColor: "#18283a",
              paddingVertical: 14,
              paddingHorizontal: 14,
              borderRadius: 14,
              marginBottom: 18,
              borderWidth: 1,
              borderColor: "#315b85"
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>
              ⭐ YLM AI Pro
            </Text>
            <Text style={{ color: isPro ? "#4ade80" : "#9fb3c8", fontSize: 13, marginTop: 4 }}>
              {isPro ? "🟢 PRO AKTİF • Reklamsız kullanım" : "Reklamsız + daha yüksek kullanım"}
            </Text>
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            {chatHistory.length === 0 ? (
              <Text style={{ color: "#8995a5", fontSize: 15, marginTop: 10 }}>Henüz sohbet geçmişi yok.</Text>
            ) : (
              chatHistory.slice().reverse().map((chat) => {
                const firstMessage = chat.messages.find((item) => item.role === "user");
                return (
                  <TouchableOpacity
                    key={chat.id}
                    onPress={() => { setMessages(chat.messages); setChatOpen(true); setHistoryOpen(false); }}
                    style={{ paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: "#1d2935" }}
                  >
                    <Text style={{ color: "#fff", fontSize: 15 }} numberOfLines={2}>
                      {firstMessage?.text || "Yeni sohbet"}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      )}

      <ScrollView
          ref={scrollViewRef}
          style={styles.chat}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {selectedImage && (
            <View style={styles.selectedImageBox}>
              <Image
                source={{ uri: selectedImage.uri }}
                style={styles.selectedImage}
              />
            </View>
          )}

          {messages.length === 0 ? (
            <View style={styles.emptyChat}>
              <View style={styles.smallOrb}>
                <Text style={styles.smallOrbText}>YLM</Text>
                <Text style={styles.smallOrbBlue}>AI</Text>
              </View>
              <Text style={styles.emptyTitle}>Yeni sohbet</Text>
              <Text style={styles.emptySubtitle}>
                YLM AI'ye ne sormak istersin?
              </Text>
            </View>
          ) : (
            messages.map((item, index) => (
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
                  {item.image && <Image source={{ uri: "data:image/png;base64," + item.image }} style={{ width: 280, height: 280, borderRadius: 16, marginBottom: 8 }} />}<Text style={styles.messageText}>{item.text}</Text>
                </View>
              </View>
            ))
          )}

          {loading && (
            <View style={styles.messageRow}>
              <View style={styles.aiBubble}>
                <Text style={styles.thinking}>YLM AI düşünüyor...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputArea}>
          <TouchableOpacity style={styles.addButton} onPress={openAttachmentMenu}>
            <Text style={styles.addText}>＋</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="YLM AI'ye bir şey sor..."
            placeholderTextColor="#777"
            value={message}
            onChangeText={setMessage}
            multiline
          />

          <TouchableOpacity style={[styles.micButton, isRecording && styles.micButtonActive]} onPress={toggleRecording}>
            <Text style={styles.micText}>🎤</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sendButton,
              ((!message.trim() && !selectedImage) || loading) &&
                styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!message.trim() && !selectedImage || loading}
          >
            <Text style={styles.sendText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.circleButton}
          onPress={() => { setHistoryOpen(true); console.log("MENU BASILDI"); }}
        >
          <Text style={styles.menuText}>☰</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => setChatOpen(true)}
        >
          <Text style={styles.profileText}>Y</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.homeContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.announcement}>
          <Text style={styles.announcementTitle}>
            Görsel oluşturma büyük bir güncelleme aldı
          </Text>
          <Text style={styles.announcementSubtitle}>
            Daha kaliteli sonuçlar, daha hızlı oluşturma ve daha akıllı
            yaratıcı araçlar
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pictureRow}
        >
          {pictures.map((uri, index) => (
            <Image
              key={index}
              source={{ uri }}
              style={styles.picture}
            />
          ))}
        </ScrollView>

        <View style={styles.orbArea}>
          <View style={styles.orbGlow}>
            <View style={styles.orb}>
              <Text style={styles.orbText}>
                YLM <Text style={styles.orbBlue}>AI</Text>
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.inputArea}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={openAttachmentMenu}
        >
          <Text style={styles.addText}>＋</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="YLM AI'ye bir şey sor..."
          placeholderTextColor="#777"
          value={message}
          onChangeText={setMessage}
          multiline
          onFocus={() => setChatOpen(true)}
        />

        <TouchableOpacity style={styles.micButton}>
          <Text style={styles.micText}>🎤</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sendButton,
            ((!message.trim() && !selectedImage) || loading) &&
              styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!message.trim() && !selectedImage || loading}
        >
          <Text style={styles.sendText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05070B',
    paddingHorizontal: 16,
    paddingTop: 42,
    paddingBottom: 14,
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  circleButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#10151D',
    borderWidth: 1,
    borderColor: '#263445',
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuText: {
    color: '#FFFFFF',
    fontSize: 22,
  },

  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#087EFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },

  homeContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 18,
  },

  announcement: {
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 24,
  },

  announcementTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 9,
  },

  announcementSubtitle: {
    color: '#8E99A8',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },

  pictureRow: {
    paddingHorizontal: 2,
    gap: 10,
    marginBottom: 22,
  },

  picture: {
    width: 112,
    height: 150,
    borderRadius: 18,
  },

  orbArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    marginBottom: 12,
  },

  orbGlow: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A1422',
  },

  orb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#101923',
    borderWidth: 1,
    borderColor: '#29435E',
    justifyContent: 'center',
    alignItems: 'center',
  },

  orbText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },

  orbBlue: {
    color: '#087EFF',
  },

  chatHeader: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  chatTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#10151D',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 25,
  },

  chat: {
    flex: 1,
  },

  chatContent: {
    paddingVertical: 12,
    paddingBottom: 20,
    flexGrow: 1,
  },

  emptyChat: {
    flex: 1,
    minHeight: 420,
    justifyContent: 'center',
    alignItems: 'center',
  },

  smallOrb: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#101923',
    borderWidth: 1,
    borderColor: '#29435E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },

  smallOrbText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },

  smallOrbBlue: {
    color: '#087EFF',
    fontSize: 17,
    fontWeight: '800',
  },

  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },

  emptySubtitle: {
    color: '#8E99A8',
    fontSize: 15,
    marginTop: 7,
  },

  selectedImageBox: {
    alignItems: 'flex-end',
    marginBottom: 14,
  },

  selectedImage: {
    width: 220,
    height: 220,
    borderRadius: 18,
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
    paddingLeft: 7,
    paddingRight: 7,
    paddingVertical: 6,
    minHeight: 58,
  },

  addButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  addText: {
    color: '#AAB4C0',
    fontSize: 27,
  },

  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    maxHeight: 110,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 5,
  },

  micButton: {
    width: 42,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  micText: {
    fontSize: 18,
  },

  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: '#087EFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  sendButtonDisabled: {
    opacity: 0.35,
  },

  sendText: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '800',
  },
});
