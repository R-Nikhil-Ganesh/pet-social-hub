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
  Modal,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThreadItem } from '@/components/community/ThreadItem';
import { ChatBubble } from '@/components/community/ChatBubble';
import { useCommunityStore } from '@/store/communityStore';
import { useAuthStore } from '@/store/authStore';
import { getSocket } from '@/services/socket';
import api from '@/services/api';

type CommunityTab = 'threads' | 'chat';

export default function CommunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const communityId = Number(id);
  const hasValidCommunityId = Number.isFinite(communityId) && communityId > 0;
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
    createThread,
    fetchChatHistory,
    addChatMessage,
    applyServerMessageReactions,
    updateMessageReaction,
  } = useCommunityStore();

  const community = communities.find((c) => c.id === communityId);
  const [activeTab, setActiveTab] = useState<CommunityTab>('threads');
  const [chatInput, setChatInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; preview: string } | null>(null);
  const [showThreadComposer, setShowThreadComposer] = useState(false);
  const [threadTitle, setThreadTitle] = useState('');
  const [threadContent, setThreadContent] = useState('');
  const [threadFlair, setThreadFlair] = useState<string>('discussion');
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const threadFlairs = ['discussion', 'question', 'advice', 'story', 'news', 'expert'];

  useEffect(() => {
    if (community) {
      navigation.setOptions({ title: community.name });
    }
    if (!hasValidCommunityId) return;
    fetchThreads(communityId);
    fetchChatHistory(communityId);
  }, [communityId, hasValidCommunityId]);

  // Socket.io for live chat
  useEffect(() => {
    if (!token || !hasValidCommunityId) return;
    const socket = getSocket(token);
    socket.emit('join:community', communityId);

    socket.on('chat:message', (msg) => {
      addChatMessage(msg);
      flatListRef.current?.scrollToEnd({ animated: true });
    });

    socket.on('chat:reaction', ({ message_id, reactions }) => {
      applyServerMessageReactions(message_id, reactions, user?.id);
    });

    socket.on('chat:error', ({ message }) => {
      if (message) {
        Alert.alert('Chat', String(message));
      }
    });

    return () => {
      socket.emit('leave:community', communityId);
      socket.off('chat:message');
      socket.off('chat:reaction');
      socket.off('chat:error');
    };
  }, [token, communityId, hasValidCommunityId, user?.id]);

  const reactToMessage = async (messageId: string, emoji: string) => {
    if (!token) return;

    // Optimistic UI so the reaction bubble appears instantly.
    if (user) {
      updateMessageReaction(messageId, emoji, {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
      });
    } else {
      updateMessageReaction(messageId, emoji);
    }

    try {
      const { data } = await api.post(`/chat/message/${messageId}/react`, { emoji });
      applyServerMessageReactions(messageId, data.reactions, user?.id);
    } catch {
      await fetchChatHistory(communityId);
      Alert.alert('Chat', 'Unable to save reaction. Please try again.');
    }
  };

  const startReplyToMessage = (message: { _id: string; content: string; type: string }) => {
    const fallbackLabel = message.type === 'image' ? 'Image' : message.type === 'gif' ? 'GIF' : 'Message';
    const preview = message.content?.trim() || fallbackLabel;
    setReplyingTo({ id: message._id, preview: preview.slice(0, 80) });
  };

  const sendMessage = () => {
    const text = chatInput.trim();
    if (!text || !token || !hasValidCommunityId) return;
    const socket = getSocket(token);
    socket.emit('chat:send', {
      community_id: communityId,
      type: 'text',
      content: text,
      reply_to: replyingTo?.id ?? null,
      reply_preview: replyingTo?.preview ?? null,
    });
    setChatInput('');
    setReplyingTo(null);
  };

  const submitThread = async () => {
    if (!hasValidCommunityId) return;
    if (!threadTitle.trim()) {
      Alert.alert('Thread title required', 'Please add a title before posting.');
      return;
    }

    setIsCreatingThread(true);
    try {
      await createThread(communityId, {
        title: threadTitle.trim(),
        content: threadContent.trim(),
        flair: threadFlair,
      });

      setThreadTitle('');
      setThreadContent('');
      setThreadFlair('discussion');
      setShowThreadComposer(false);
    } catch {
      Alert.alert('Error', 'Could not create thread. Please try again.');
    } finally {
      setIsCreatingThread(false);
    }
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
            ListHeaderComponent={
              <TouchableOpacity
                style={styles.newThreadBtn}
                onPress={() => setShowThreadComposer(true)}
              >
                <ThemedText style={styles.newThreadBtnText}>+ Start New Thread</ThemedText>
              </TouchableOpacity>
            }
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
              renderItem={({ item }) => (
                <ChatBubble
                  message={item}
                  onReplyPress={() => startReplyToMessage(item)}
                  onReactPress={(emoji) => reactToMessage(item._id, emoji)}
                />
              )}
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
          {replyingTo && (
            <View style={styles.replyComposerPreview}>
              <View style={styles.replyPreviewBar} />
              <View style={styles.replyPreviewTextWrap}>
                <ThemedText style={styles.replyComposerTitle}>Replying to message</ThemedText>
                <ThemedText style={styles.replyComposerText} numberOfLines={1}>
                  {replyingTo.preview}
                </ThemedText>
              </View>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <ThemedText style={styles.replyComposerClose}>✕</ThemedText>
              </TouchableOpacity>
            </View>
          )}
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

      <Modal
        visible={showThreadComposer}
        transparent
        animationType="slide"
        onRequestClose={() => setShowThreadComposer(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Create Thread</ThemedText>
              <TouchableOpacity onPress={() => setShowThreadComposer(false)}>
                <ThemedText style={styles.modalClose}>✕</ThemedText>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.threadTitleInput}
              value={threadTitle}
              onChangeText={setThreadTitle}
              placeholder="Title"
              placeholderTextColor="#A1A1AA"
              maxLength={200}
            />

            <TextInput
              style={styles.threadContentInput}
              value={threadContent}
              onChangeText={setThreadContent}
              placeholder="What do you want to discuss?"
              placeholderTextColor="#A1A1AA"
              multiline
              maxLength={2000}
            />

            <View style={styles.flairRow}>
              {threadFlairs.map((flair) => (
                <TouchableOpacity
                  key={flair}
                  style={[styles.flairChip, threadFlair === flair && styles.flairChipActive]}
                  onPress={() => setThreadFlair(flair)}
                >
                  <ThemedText
                    style={[styles.flairChipText, threadFlair === flair && styles.flairChipTextActive]}
                  >
                    {flair}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.publishThreadBtn, isCreatingThread && styles.publishThreadBtnDisabled]}
              onPress={submitThread}
              disabled={isCreatingThread}
            >
              {isCreatingThread ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <ThemedText style={styles.publishThreadText}>Publish Thread</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  newThreadBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  newThreadBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: { padding: 12 },
  chatContainer: { flex: 1 },
  chatContent: { padding: 8, paddingBottom: 16 },
  replyComposerPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F4F4F5',
    marginHorizontal: 10,
    marginBottom: 6,
    marginTop: 8,
    borderRadius: 10,
    padding: 8,
  },
  replyPreviewBar: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 3,
    backgroundColor: '#7C3AED',
  },
  replyPreviewTextWrap: {
    flex: 1,
    gap: 2,
  },
  replyComposerTitle: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '700',
  },
  replyComposerText: {
    fontSize: 12,
    color: '#52525B',
  },
  replyComposerClose: {
    fontSize: 14,
    color: '#71717A',
    fontWeight: '700',
  },
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 14,
    gap: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18181B',
  },
  modalClose: {
    fontSize: 16,
    color: '#71717A',
    fontWeight: '700',
  },
  threadTitleInput: {
    borderWidth: 1.5,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#18181B',
    fontSize: 15,
  },
  threadContentInput: {
    borderWidth: 1.5,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#18181B',
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  flairRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  flairChip: {
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F5F3FF',
  },
  flairChipActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  flairChipText: {
    color: '#5B21B6',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  flairChipTextActive: {
    color: '#fff',
  },
  publishThreadBtn: {
    marginTop: 4,
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  publishThreadBtnDisabled: {
    opacity: 0.6,
  },
  publishThreadText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  empty: { alignItems: 'center', padding: 40, gap: 10 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#18181B' },
  emptySubtext: { fontSize: 14, color: '#71717A', textAlign: 'center' },
});
