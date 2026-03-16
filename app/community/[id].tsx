import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThreadItem } from '@/components/community/ThreadItem';
import { ChatBubble } from '@/components/community/ChatBubble';
import { useCommunityStore } from '@/store/communityStore';
import { useAuthStore } from '@/store/authStore';
import { getSocket } from '@/services/socket';

type CommunityTab = 'threads' | 'chat';

export default function CommunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const communityId = Number(id);
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const {
    communities,
    threads,
    chatMessages,
    isThreadsLoading,
    isChatLoading,
    fetchThreads,
    fetchChatHistory,
    addChatMessage,
  } = useCommunityStore();

  const community = communities.find((c) => c.id === communityId);
  const [activeTab, setActiveTab] = useState<CommunityTab>('threads');
  const [chatInput, setChatInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (community) {
      navigation.setOptions({ title: community.name });
    }
    fetchThreads(communityId);
    fetchChatHistory(communityId);
  }, [communityId]);

  // Socket.io for live chat
  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);
    socket.emit('join:community', communityId);

    socket.on('chat:message', (msg) => {
      addChatMessage(msg);
      flatListRef.current?.scrollToEnd({ animated: true });
    });

    return () => {
      socket.emit('leave:community', communityId);
      socket.off('chat:message');
    };
  }, [token, communityId]);

  const sendMessage = () => {
    const text = chatInput.trim();
    if (!text || !token) return;
    const socket = getSocket(token);
    socket.emit('chat:send', {
      community_id: communityId,
      type: 'text',
      content: text,
    });
    setChatInput('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Tab Toggle */}
      <View style={styles.tabRow}>
        {(['threads', 'chat'] as CommunityTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <ThemedText style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'threads' ? '📋 Threads' : '💬 Live Chat'}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'threads' ? (
        isThreadsLoading ? (
          <ActivityIndicator color="#7C3AED" style={styles.loader} />
        ) : (
          <FlatList
            data={threads}
            keyExtractor={(item) => `thread-${item.id}`}
            renderItem={({ item }) => <ThreadItem thread={item} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.empty}>
                <ThemedText style={styles.emptyEmoji}>📝</ThemedText>
                <ThemedText style={styles.emptyTitle}>No threads yet</ThemedText>
                <ThemedText style={styles.emptySubtext}>
                  Start the conversation in this community!
                </ThemedText>
              </View>
            }
          />
        )
      ) : (
        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={140}
        >
          {isChatLoading ? (
            <ActivityIndicator color="#7C3AED" style={styles.loader} />
          ) : (
            <FlatList
              ref={flatListRef}
              data={chatMessages}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => <ChatBubble message={item} />}
              contentContainerStyle={styles.chatContent}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <ThemedText style={styles.emptyEmoji}>👋</ThemedText>
                  <ThemedText style={styles.emptyTitle}>No messages yet</ThemedText>
                  <ThemedText style={styles.emptySubtext}>Say hello to the community!</ThemedText>
                </View>
              }
            />
          )}
          {/* Chat Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.chatInput}
              value={chatInput}
              onChangeText={setChatInput}
              placeholder={`Message ${community?.name ?? 'community'}…`}
              placeholderTextColor="#A1A1AA"
              returnKeyType="send"
              onSubmitEditing={sendMessage}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !chatInput.trim() && styles.sendBtnDisabled]}
              onPress={sendMessage}
              disabled={!chatInput.trim()}
            >
              <ThemedText style={styles.sendBtnText}>↑</ThemedText>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9F9FB' },
  tabRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E4E7',
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: '#F4F4F5',
  },
  tabActive: { backgroundColor: '#7C3AED' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#52525B' },
  tabTextActive: { color: '#fff' },
  loader: { marginTop: 40 },
  listContent: { padding: 12 },
  chatContainer: { flex: 1 },
  chatContent: { padding: 8, paddingBottom: 16 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    gap: 8,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E4E4E7',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#F4F4F5',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#18181B',
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#E4E4E7' },
  sendBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  empty: { alignItems: 'center', padding: 40, gap: 10 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#18181B' },
  emptySubtext: { fontSize: 14, color: '#71717A', textAlign: 'center' },
});
