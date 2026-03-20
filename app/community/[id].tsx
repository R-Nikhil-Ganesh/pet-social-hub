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
  Image,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/ThemedText';
import { ThreadItem } from '@/components/community/ThreadItem';
import { ChatBubble } from '@/components/community/ChatBubble';
import { useCommunityStore } from '@/store/communityStore';
import { useAuthStore } from '@/store/authStore';
import { getSocket } from '@/services/socket';
import api from '@/services/api';

type CommunityTab = 'threads' | 'chat';

type CommunityMember = {
  id: number;
  username: string;
  display_name?: string;
  avatar_url?: string;
  is_professional?: boolean;
  professional_type?: string;
};

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
    leaveCommunity,
  } = useCommunityStore();

  const community = communities.find((c) => c.id === communityId);
  const [communityTitle, setCommunityTitle] = useState<string>('Community');
  const [activeTab, setActiveTab] = useState<CommunityTab>('threads');
  const [chatInput, setChatInput] = useState('');
  const [chatImageUri, setChatImageUri] = useState<string | null>(null);
  const [isSendingImage, setIsSendingImage] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; preview: string } | null>(null);
  const [showThreadComposer, setShowThreadComposer] = useState(false);
  const [threadTitle, setThreadTitle] = useState('');
  const [threadContent, setThreadContent] = useState('');
  const [threadFlair, setThreadFlair] = useState<string>('discussion');
  const [threadMediaUri, setThreadMediaUri] = useState<string | null>(null);
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [showCommunityDetails, setShowCommunityDetails] = useState(false);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsCommunity, setDetailsCommunity] = useState<typeof community | null>(null);
  const [isLeavingCommunity, setIsLeavingCommunity] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const threadFlairs = ['discussion', 'question', 'advice', 'story', 'news', 'expert'];

  useEffect(() => {
    navigation.setOptions({
      headerTitleAlign: 'left',
      headerTitle: () => (
        <TouchableOpacity onPress={() => openCommunityDetails()} hitSlop={8}>
          <ThemedText style={styles.headerTitle}>{community?.name || communityTitle}</ThemedText>
        </TouchableOpacity>
      ),
    });
    if (!hasValidCommunityId) return;
    fetchThreads(communityId);
    fetchChatHistory(communityId);
  }, [communityId, hasValidCommunityId, community?.name, communityTitle, navigation, fetchThreads, fetchChatHistory]);

  useEffect(() => {
    if (!hasValidCommunityId) return;
    if (community?.name) {
      setCommunityTitle(community.name);
      return;
    }

    let mounted = true;
    api
      .get(`/communities/${communityId}`)
      .then(({ data }) => {
        if (!mounted) return;
        const title = data?.community?.name;
        if (title) {
          setCommunityTitle(String(title));
        }
      })
      .catch(() => {
        if (mounted) {
          setCommunityTitle('Community');
        }
      });

    return () => {
      mounted = false;
    };
  }, [communityId, hasValidCommunityId, community?.name]);

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

  const sendMessage = async () => {
    const text = chatInput.trim();
    if ((!text && !chatImageUri) || !token || !hasValidCommunityId) return;
    const socket = getSocket(token);

    if (chatImageUri) {
      setIsSendingImage(true);
      try {
        const form = new FormData() as any;
        if (Platform.OS === 'web') {
          const response = await fetch(chatImageUri);
          const blob = await response.blob();
          form.append('image', blob, 'chat-image.jpg');
        } else {
          const fileName = chatImageUri.split('/').pop() ?? 'chat-image.jpg';
          form.append('image', { uri: chatImageUri, name: fileName, type: 'image/jpeg' } as any);
        }

        const { data } = await api.post(`/chat/${communityId}/image`, form);
        const mediaUrl = data?.url;
        if (!mediaUrl) throw new Error('Upload did not return image url');

        socket.emit('chat:send', {
          community_id: communityId,
          type: 'image',
          media_url: mediaUrl,
          content: mediaUrl,
          reply_to: replyingTo?.id ?? null,
          reply_preview: replyingTo?.preview ?? null,
        });

        setChatImageUri(null);
      } catch {
        Alert.alert('Chat', 'Unable to send image. Please try again.');
      } finally {
        setIsSendingImage(false);
      }
    }

    if (text) {
      socket.emit('chat:send', {
        community_id: communityId,
        type: 'text',
        content: text,
        reply_to: replyingTo?.id ?? null,
        reply_preview: replyingTo?.preview ?? null,
      });
    }

    setChatInput('');
    setReplyingTo(null);
  };

  const pickChatImageFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to send images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]) {
      setChatImageUri(result.assets[0].uri);
    }
  };

  const takeChatPhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow camera access to capture an image.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]) {
      setChatImageUri(result.assets[0].uri);
    }
  };

  const pickChatImage = () => {
    Alert.alert('Send image', 'Choose image source', [
      { text: 'Camera', onPress: takeChatPhoto },
      { text: 'Library', onPress: pickChatImageFromLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const openCommunityDetails = async () => {
    if (!hasValidCommunityId) return;
    setShowCommunityDetails(true);
    setIsLoadingDetails(true);

    try {
      const { data } = await api.get(`/communities/${communityId}/members`);
      setDetailsCommunity(data?.community ?? null);
      setMembers(Array.isArray(data?.members) ? data.members : []);
      const title = data?.community?.name;
      if (title) {
        setCommunityTitle(String(title));
      }
    } catch {
      Alert.alert('Community', 'Unable to load community details right now.');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleLeaveCommunity = () => {
    if (!hasValidCommunityId) return;
    Alert.alert('Leave Community', 'Are you sure you want to leave this group?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsLeavingCommunity(true);
            await leaveCommunity(communityId);
            setShowCommunityDetails(false);
            navigation.goBack();
          } catch {
            Alert.alert('Community', 'Unable to leave this group right now.');
          } finally {
            setIsLeavingCommunity(false);
          }
        },
      },
    ]);
  };

  const resolvedCommunity = detailsCommunity ?? community;

  const submitThread = async () => {
    if (!hasValidCommunityId) return;
    if (!threadTitle.trim()) {
      Alert.alert('Thread title required', 'Please add a title before posting.');
      return;
    }

    setIsCreatingThread(true);
    try {
      if (threadMediaUri) {
        const form = new FormData() as any;
        form.append('title', threadTitle.trim());
        form.append('content', threadContent.trim());
        form.append('flair', threadFlair);
        if (Platform.OS === 'web') {
          const response = await fetch(threadMediaUri);
          const blob = await response.blob();
          form.append('media', blob, 'thread-image.jpg');
        } else {
          const fileName = threadMediaUri.split('/').pop() ?? 'thread-image.jpg';
          form.append('media', { uri: threadMediaUri, name: fileName, type: 'image/jpeg' } as any);
        }
        await createThread(communityId, form);
      } else {
        await createThread(communityId, {
          title: threadTitle.trim(),
          content: threadContent.trim(),
          flair: threadFlair,
        });
      }

      setThreadTitle('');
      setThreadContent('');
      setThreadFlair('discussion');
      setThreadMediaUri(null);
      setShowThreadComposer(false);
    } catch {
      Alert.alert('Error', 'Could not create thread. Please try again.');
    } finally {
      setIsCreatingThread(false);
    }
  };

  const pickThreadMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to add an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]) {
      setThreadMediaUri(result.assets[0].uri);
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
                <ThemedText style={styles.newThreadBtnText}>Start new thread</ThemedText>
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
          {chatImageUri && (
            <View style={styles.chatImagePreviewWrap}>
              <Image source={{ uri: chatImageUri }} style={styles.chatImagePreview} />
              <TouchableOpacity style={styles.removeChatImageBtn} onPress={() => setChatImageUri(null)}>
                <ThemedText style={styles.removeChatImageText}>✕</ThemedText>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.pickImageBtn} onPress={pickChatImage}>
              <ThemedText style={styles.pickImageText}>📷</ThemedText>
            </TouchableOpacity>
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
              style={[
                styles.sendBtn,
                (!chatInput.trim() && !chatImageUri) && styles.sendBtnDisabled,
                isSendingImage && styles.sendBtnDisabled,
              ]}
              onPress={sendMessage}
              disabled={(!chatInput.trim() && !chatImageUri) || isSendingImage}
            >
              {isSendingImage ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <ThemedText style={styles.sendBtnText}>↑</ThemedText>
              )}
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

            {threadMediaUri ? (
              <View style={styles.threadMediaPreviewWrap}>
                <Image source={{ uri: threadMediaUri }} style={styles.threadMediaPreview} />
                <TouchableOpacity style={styles.removeThreadMediaBtn} onPress={() => setThreadMediaUri(null)}>
                  <ThemedText style={styles.removeThreadMediaText}>✕</ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addThreadImageBtn} onPress={pickThreadMedia}>
                <ThemedText style={styles.addThreadImageText}>+ Add image</ThemedText>
              </TouchableOpacity>
            )}

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

      <Modal
        visible={showCommunityDetails}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCommunityDetails(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Community Details</ThemedText>
              <TouchableOpacity onPress={() => setShowCommunityDetails(false)}>
                <ThemedText style={styles.modalClose}>✕</ThemedText>
              </TouchableOpacity>
            </View>

            {isLoadingDetails ? (
              <ActivityIndicator color="#7C3AED" style={styles.loader} />
            ) : (
              <>
                <View style={styles.detailsTopRow}>
                  {resolvedCommunity?.icon_url ? (
                    <Image source={{ uri: resolvedCommunity.icon_url }} style={styles.detailsIcon} />
                  ) : (
                    <View style={styles.detailsIconFallback}>
                      <ThemedText style={styles.detailsIconEmoji}>
                        {resolvedCommunity?.icon_emoji || '🐾'}
                      </ThemedText>
                    </View>
                  )}
                  <View style={styles.detailsTopTextWrap}>
                    <ThemedText style={styles.detailsCommunityName}>
                      {resolvedCommunity?.name || communityTitle}
                    </ThemedText>
                    <ThemedText style={styles.detailsMemberCount}>
                      {(resolvedCommunity?.member_count ?? members.length) || 0} participants
                    </ThemedText>
                  </View>
                </View>

                {!!resolvedCommunity?.description && (
                  <ThemedText style={styles.detailsDescription}>{resolvedCommunity.description}</ThemedText>
                )}

                <ThemedText style={styles.detailsSectionTitle}>Participants</ThemedText>
                <ScrollView style={styles.participantsList}>
                  {members.length ? (
                    members.map((member) => (
                      <View key={`member-${member.id}`} style={styles.memberRow}>
                        {member.avatar_url ? (
                          <Image source={{ uri: member.avatar_url }} style={styles.memberAvatar} />
                        ) : (
                          <View style={styles.memberAvatarFallback}>
                            <ThemedText style={styles.memberAvatarFallbackText}>
                              {(member.display_name || member.username || '?').charAt(0).toUpperCase()}
                            </ThemedText>
                          </View>
                        )}
                        <View style={styles.memberTextWrap}>
                          <ThemedText style={styles.memberName}>
                            {member.display_name || member.username}
                          </ThemedText>
                          <ThemedText style={styles.memberHandle}>@{member.username}</ThemedText>
                        </View>
                        {member.is_professional ? (
                          <View style={styles.professionalBadge}>
                            <ThemedText style={styles.professionalBadgeText}>
                              {member.professional_type || 'Pro'}
                            </ThemedText>
                          </View>
                        ) : null}
                      </View>
                    ))
                  ) : (
                    <ThemedText style={styles.noMembersText}>No participants found.</ThemedText>
                  )}
                </ScrollView>

                {resolvedCommunity?.is_member ? (
                  <TouchableOpacity
                    style={[styles.leaveCommunityBtn, isLeavingCommunity && styles.publishThreadBtnDisabled]}
                    onPress={handleLeaveCommunity}
                    disabled={isLeavingCommunity}
                  >
                    {isLeavingCommunity ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <ThemedText style={styles.leaveCommunityBtnText}>Leave Group</ThemedText>
                    )}
                  </TouchableOpacity>
                ) : null}
              </>
            )}
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#18181B',
  },
  loader: { marginTop: 40 },
  newThreadBtn: {
    alignSelf: 'flex-end',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D4D4D8',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  newThreadBtnText: {
    color: '#52525B',
    fontSize: 12,
    fontWeight: '600',
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
  pickImageBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickImageText: {
    fontSize: 18,
  },
  chatImagePreviewWrap: {
    marginHorizontal: 10,
    marginBottom: 6,
    marginTop: 8,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    width: 140,
    height: 100,
  },
  chatImagePreview: {
    width: '100%',
    height: '100%',
  },
  removeChatImageBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeChatImageText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
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
  addThreadImageBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    backgroundColor: '#F5F3FF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  addThreadImageText: {
    fontSize: 12,
    color: '#6D28D9',
    fontWeight: '700',
  },
  threadMediaPreviewWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  threadMediaPreview: {
    width: '100%',
    height: 170,
  },
  removeThreadMediaBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeThreadMediaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
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
  detailsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailsIcon: {
    width: 58,
    height: 58,
    borderRadius: 14,
  },
  detailsIconFallback: {
    width: 58,
    height: 58,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F5',
  },
  detailsIconEmoji: {
    fontSize: 30,
  },
  detailsTopTextWrap: {
    flex: 1,
    gap: 4,
  },
  detailsCommunityName: {
    color: '#18181B',
    fontSize: 18,
    fontWeight: '800',
  },
  detailsMemberCount: {
    color: '#71717A',
    fontSize: 13,
    fontWeight: '600',
  },
  detailsDescription: {
    color: '#3F3F46',
    fontSize: 14,
    lineHeight: 20,
  },
  detailsSectionTitle: {
    color: '#18181B',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  participantsList: {
    maxHeight: 280,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECECF1',
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  memberAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E4E4E7',
  },
  memberAvatarFallbackText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3F3F46',
  },
  memberTextWrap: {
    flex: 1,
    gap: 1,
  },
  memberName: {
    color: '#18181B',
    fontSize: 13,
    fontWeight: '700',
  },
  memberHandle: {
    color: '#71717A',
    fontSize: 12,
  },
  noMembersText: {
    color: '#71717A',
    fontSize: 13,
    paddingVertical: 12,
  },
  professionalBadge: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  professionalBadgeText: {
    color: '#3730A3',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  leaveCommunityBtn: {
    marginTop: 8,
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  leaveCommunityBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  empty: { alignItems: 'center', padding: 40, gap: 10 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#18181B' },
  emptySubtext: { fontSize: 14, color: '#71717A', textAlign: 'center' },
});
