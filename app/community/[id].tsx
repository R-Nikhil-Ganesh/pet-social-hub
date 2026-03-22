import React, { useEffect, useState, useRef } from 'react';
import {
  Animated,
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
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ThreadItem } from '@/components/community/ThreadItem';
import { ChatBubble } from '@/components/community/ChatBubble';
import { useCommunityStore } from '@/store/communityStore';
import { useAuthStore } from '@/store/authStore';
import { getSocket } from '@/services/socket';
import api from '@/services/api';
import { colors, radius, spacing, typography } from '@/theme/tokens';

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
  const [tabBarWidth, setTabBarWidth] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const tabContentOpacity = useRef(new Animated.Value(1)).current;
  const tabIndicatorIndex = useRef(new Animated.Value(0)).current;

  const threadFlairs = ['discussion', 'question', 'advice', 'story', 'news', 'expert'];

  useEffect(() => {
    navigation.setOptions({
      headerTitleAlign: 'left',
      headerTitle: () => (
        <TouchableOpacity onPress={() => openCommunityDetails()} hitSlop={8} accessibilityRole="button" accessibilityLabel="Open community details">
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

  useEffect(() => {
    tabContentOpacity.setValue(0.9);
    Animated.timing(tabContentOpacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [activeTab, tabContentOpacity]);

  useEffect(() => {
    Animated.spring(tabIndicatorIndex, {
      toValue: activeTab === 'threads' ? 0 : 1,
      useNativeDriver: true,
      speed: 24,
      bounciness: 0,
    }).start();
  }, [activeTab, tabIndicatorIndex]);

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

  const tabGap = spacing.xs;
  const tabBarInset = spacing.xxs;
  const indicatorWidth = tabBarWidth > 0 ? (tabBarWidth - tabBarInset * 2 - tabGap) / 2 : 0;
  const indicatorTranslateX = tabIndicatorIndex.interpolate({
    inputRange: [0, 1],
    outputRange: [0, indicatorWidth + tabGap],
  });

  const handleTabPress = (nextTab: CommunityTab) => {
    if (nextTab === activeTab) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setActiveTab(nextTab);
  };

  const handleOpenThreadComposer = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setShowThreadComposer(true);
  };

  const handleSendMessagePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    void sendMessage();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Tab Toggle */}
      <View style={styles.tabRow} onLayout={(e) => setTabBarWidth(e.nativeEvent.layout.width)}>
        {indicatorWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.tabIndicator,
              {
                width: indicatorWidth,
                transform: [{ translateX: indicatorTranslateX }],
              },
            ]}
          />
        )}
        {(['threads', 'chat'] as CommunityTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={styles.tab}
            onPress={() => handleTabPress(tab)}
            accessibilityRole="button"
            accessibilityLabel={tab === 'threads' ? 'Open threads tab' : 'Open live chat tab'}
            accessibilityState={{ selected: activeTab === tab }}
          >
            <ThemedText style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'threads' ? 'Threads' : 'Live Chat'}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      <Animated.View style={styles.tabContentWrap}>
        {activeTab === 'threads' ? (
          isThreadsLoading ? (
            <ActivityIndicator color={colors.brand.primary} style={styles.loader} />
          ) : (
            <Animated.View style={[styles.tabContentFill, { opacity: tabContentOpacity }]}>
              <FlatList
                data={threads}
                keyExtractor={(item) => `thread-${item.id}`}
                renderItem={({ item }) => <ThreadItem thread={item} />}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                  <Button
                    style={styles.newThreadBtn}
                    variant="secondary"
                    label="Start new thread"
                    onPress={handleOpenThreadComposer}
                  />
                }
                ListEmptyComponent={
                  <View style={styles.emptyWrap}>
                    <EmptyState
                      iconName="document-text-outline"
                      iconColor={colors.text.secondary}
                      title="No threads yet"
                      subtitle="Start the conversation in this community!"
                    />
                  </View>
                }
              />
            </Animated.View>
          )
        ) : (
          <Animated.View style={[styles.tabContentFill, { opacity: tabContentOpacity }]}>
            <KeyboardAvoidingView
              style={styles.chatContainer}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={140}
            >
              {isChatLoading ? (
                <ActivityIndicator color={colors.brand.primary} style={styles.loader} />
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
                    <View style={styles.emptyWrap}>
                      <EmptyState iconName="chatbubble-ellipses-outline" iconColor={colors.text.secondary} title="No messages yet" subtitle="Say hello to the community!" />
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
                  <TouchableOpacity onPress={() => setReplyingTo(null)} accessibilityRole="button" accessibilityLabel="Cancel reply">
                    <ThemedText style={styles.replyComposerClose}>✕</ThemedText>
                  </TouchableOpacity>
                </View>
              )}
              {chatImageUri && (
                <View style={styles.chatImagePreviewWrap}>
                  <Image source={{ uri: chatImageUri }} style={styles.chatImagePreview} />
                  <TouchableOpacity style={styles.removeChatImageBtn} onPress={() => setChatImageUri(null)} accessibilityRole="button" accessibilityLabel="Remove attached image">
                    <ThemedText style={styles.removeChatImageText}>✕</ThemedText>
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.inputRow}>
                <TouchableOpacity style={styles.imageIconBtn} onPress={pickChatImage} accessibilityLabel="Attach image" accessibilityRole="button">
                  <Ionicons name="image-outline" size={20} color={colors.brand.primary} />
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
                <Button
                  style={[
                    styles.sendBtn,
                    (!chatInput.trim() && !chatImageUri) && styles.sendBtnDisabled,
                    isSendingImage && styles.sendBtnDisabled,
                  ]}
                  label={isSendingImage ? '' : '↑'}
                  onPress={handleSendMessagePress}
                  loading={isSendingImage}
                  disabled={(!chatInput.trim() && !chatImageUri) || isSendingImage}
                  accessibilityLabel="Send chat message"
                />
              </View>
            </KeyboardAvoidingView>
          </Animated.View>
        )}
      </Animated.View>

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
              <TouchableOpacity onPress={() => setShowThreadComposer(false)} accessibilityRole="button" accessibilityLabel="Close thread composer">
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
                <TouchableOpacity style={styles.removeThreadMediaBtn} onPress={() => setThreadMediaUri(null)} accessibilityRole="button" accessibilityLabel="Remove thread image">
                  <ThemedText style={styles.removeThreadMediaText}>✕</ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addThreadImageBtn} onPress={pickThreadMedia} accessibilityRole="button" accessibilityLabel="Add image to thread">
                <Ionicons name="image-outline" size={24} color={colors.brand.primary} />
              </TouchableOpacity>
            )}

            <View style={styles.flairRow}>
              {threadFlairs.map((flair) => (
                <TouchableOpacity
                  key={flair}
                  style={[styles.flairChip, threadFlair === flair && styles.flairChipActive]}
                  onPress={() => setThreadFlair(flair)}
                  accessibilityRole="button"
                  accessibilityLabel={`Set thread flair to ${flair}`}
                  accessibilityState={{ selected: threadFlair === flair }}
                >
                  <ThemedText
                    style={[styles.flairChipText, threadFlair === flair && styles.flairChipTextActive]}
                  >
                    {flair}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              style={[styles.publishThreadBtn, isCreatingThread && styles.publishThreadBtnDisabled]}
              label="Publish Thread"
              onPress={submitThread}
              loading={isCreatingThread}
              disabled={isCreatingThread}
            />
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
              <TouchableOpacity onPress={() => setShowCommunityDetails(false)} accessibilityRole="button" accessibilityLabel="Close community details">
                <ThemedText style={styles.modalClose}>✕</ThemedText>
              </TouchableOpacity>
            </View>

            {isLoadingDetails ? (
              <ActivityIndicator color={colors.brand.primary} style={styles.loader} />
            ) : (
              <>
                <View style={styles.detailsTopRow}>
                  {resolvedCommunity?.icon_url ? (
                    <Image source={{ uri: resolvedCommunity.icon_url }} style={styles.detailsIcon} />
                  ) : (
                    <View style={styles.detailsIconFallback}>
                      <ThemedText style={styles.detailsIconEmoji}>
                        {(resolvedCommunity?.name || 'C').charAt(0).toUpperCase()}
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
                  <Button
                    style={[styles.leaveCommunityBtn, isLeavingCommunity && styles.publishThreadBtnDisabled]}
                    label="Leave Group"
                    onPress={handleLeaveCommunity}
                    loading={isLeavingCommunity}
                    disabled={isLeavingCommunity}
                  />
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
  safeArea: { flex: 1, backgroundColor: colors.bg.app },
  tabRow: {
    position: 'relative',
    flexDirection: 'row',
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    padding: spacing.xxs,
    gap: spacing.xs,
    backgroundColor: colors.bg.muted,
    borderRadius: radius.pill,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.soft,
  },
  tabIndicator: {
    position: 'absolute',
    left: spacing.xxs,
    top: spacing.xxs,
    bottom: spacing.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: radius.pill,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabText: { fontSize: 13, fontWeight: typography.weight.semibold, color: colors.text.secondary },
  tabTextActive: { color: colors.text.inverse },
  headerTitle: {
    fontSize: 18,
    fontWeight: typography.weight.extrabold,
    color: colors.text.primary,
  },
  loader: { marginTop: 40 },
  tabContentWrap: { flex: 1 },
  tabContentFill: { flex: 1 },
  newThreadBtn: {
    alignSelf: 'flex-end',
    minHeight: 44,
    minWidth: 140,
    marginBottom: 10,
  },
  listContent: { padding: spacing.sm },
  chatContainer: { flex: 1 },
  chatContent: { padding: spacing.xs, paddingBottom: spacing.md },
  replyComposerPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bg.muted,
    marginHorizontal: 10,
    marginBottom: 6,
    marginTop: 8,
    borderRadius: radius.sm,
    padding: 8,
  },
  replyPreviewBar: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 3,
    backgroundColor: colors.brand.primary,
  },
  replyPreviewTextWrap: {
    flex: 1,
    gap: 2,
  },
  replyComposerTitle: {
    fontSize: 11,
    color: colors.brand.primary,
    fontWeight: typography.weight.bold,
  },
  replyComposerText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  replyComposerClose: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: typography.weight.bold,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    gap: spacing.xs,
    backgroundColor: colors.bg.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.soft,
  },
  chatInput: {
    flex: 1,
    backgroundColor: colors.bg.muted,
    borderRadius: radius.pill,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text.primary,
    maxHeight: 100,
  },
  pickImageBtn: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageIconBtn: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
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
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 0,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
  },
  sendBtnDisabled: { backgroundColor: colors.border.strong },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
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
    fontWeight: typography.weight.extrabold,
    color: colors.text.primary,
  },
  modalClose: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: typography.weight.bold,
  },
  threadTitleInput: {
    borderWidth: 1.5,
    borderColor: colors.border.soft,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text.primary,
    fontSize: 15,
  },
  threadContentInput: {
    borderWidth: 1.5,
    borderColor: colors.border.soft,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text.primary,
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  addThreadImageBtn: {
    borderWidth: 1.5,
    borderColor: colors.border.strong,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderColor: colors.border.strong,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.bg.subtle,
  },
  flairChipActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  flairChipText: {
    color: colors.brand.primaryDark,
    fontSize: 12,
    fontWeight: typography.weight.bold,
    textTransform: 'capitalize',
  },
  flairChipTextActive: {
    color: colors.text.inverse,
  },
  publishThreadBtn: {
    marginTop: 4,
    backgroundColor: colors.brand.primary,
    borderRadius: radius.md,
    minHeight: 44,
  },
  publishThreadBtnDisabled: {
    opacity: 0.6,
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
    backgroundColor: colors.bg.muted,
  },
  detailsIconEmoji: {
    fontSize: 30,
  },
  detailsTopTextWrap: {
    flex: 1,
    gap: 4,
  },
  detailsCommunityName: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  detailsMemberCount: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
  detailsDescription: {
    color: colors.text.secondary,
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
    borderBottomColor: colors.border.soft,
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
    backgroundColor: colors.border.soft,
  },
  memberAvatarFallbackText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  memberTextWrap: {
    flex: 1,
    gap: 1,
  },
  memberName: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  memberHandle: {
    color: colors.text.secondary,
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
    backgroundColor: colors.state.danger,
    borderRadius: radius.md,
    minHeight: 44,
  },
  emptyWrap: { padding: spacing.xl },
});
