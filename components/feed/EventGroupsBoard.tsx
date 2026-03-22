import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/ui/Avatar';
import {
  ConnectionUser,
  EventItem,
  useFeedStore,
} from '@/store/feedStore';

interface EventGroupsBoardProps {
  events: EventItem[];
  connections: ConnectionUser[];
}

function relationLabel(connection: ConnectionUser) {
  if (connection.is_following && connection.is_follower) return 'Mutual';
  if (connection.is_following) return 'Following';
  return 'Follower';
}

function formatStartsAt(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'TBA';
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function EventGroupsBoard({ events, connections }: EventGroupsBoardProps) {
  const router = useRouter();
  const createEventGroup = useFeedStore((state) => state.createEventGroup);
  const isCreatingEventGroup = useFeedStore((state) => state.isCreatingEventGroup);

  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sortedConnections = useMemo(
    () => [...connections].sort((a, b) => a.display_name.localeCompare(b.display_name)),
    [connections]
  );

  const openCreateGroupModal = (event: EventItem) => {
    setSelectedEvent(event);
    setSelectedMemberIds([]);
    setIsModalOpen(true);
  };

  const toggleMember = (memberId: number) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const closeModal = () => {
    if (isCreatingEventGroup) return;
    setIsModalOpen(false);
    setSelectedEvent(null);
    setSelectedMemberIds([]);
  };

  const handleCreateGroup = async () => {
    if (!selectedEvent) return;
    if (selectedMemberIds.length === 0) {
      Alert.alert('Choose people', 'Select at least one follower or following for this group.');
      return;
    }

    try {
      await createEventGroup(selectedEvent.id, selectedMemberIds);
      closeModal();
      Alert.alert('Requests sent', 'Invited people received group requests.');
    } catch {
      Alert.alert('Could not create group', 'Please try again in a moment.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Ionicons name="calendar-outline" size={16} color="#18181B" />
        <ThemedText style={styles.sectionTitle}>Event Groups</ThemedText>
        <ThemedText style={styles.sectionSubtitle}>Create private groups for events</ThemedText>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventsScroll}>
        {events.map((event) => (
          <View key={event.id} style={styles.eventCard}>
            {event.cover_url ? <Image source={{ uri: event.cover_url }} style={styles.eventCover} /> : null}
            <View style={styles.eventBody}>
              <ThemedText style={styles.eventDate}>{formatStartsAt(event.starts_at)}</ThemedText>
              <ThemedText style={styles.eventTitle}>{event.title}</ThemedText>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={12} color="#52525B" />
                <ThemedText style={styles.eventLocation}>{event.location_name || 'Location TBA'}</ThemedText>
              </View>
              <ThemedText style={styles.eventDescription} numberOfLines={2}>
                {event.description}
              </ThemedText>

              {event.created_groups.length > 0 && (
                <View style={styles.groupListWrap}>
                  <ThemedText style={styles.groupListTitle}>Your groups</ThemedText>
                  {event.created_groups.map((group) => (
                    <TouchableOpacity
                      key={group.id}
                      activeOpacity={group.community_id ? 0.85 : 1}
                      onPress={() => {
                        if (group.community_id) {
                          router.push({
                            pathname: '/community/[id]',
                            params: { id: String(group.community_id) },
                          } as never);
                        }
                      }}
                      style={styles.groupRow}
                    >
                      <View style={styles.groupTextWrap}>
                        <ThemedText style={styles.groupName}>{group.name}</ThemedText>
                        <ThemedText style={styles.groupMeta}>
                          {group.member_count} member{group.member_count === 1 ? '' : 's'}
                        </ThemedText>
                      </View>
                      <View style={styles.groupAvatars}>
                        {group.members.slice(0, 4).map((member, index) => (
                          <View key={member.id} style={[styles.memberAvatarWrap, { marginLeft: index === 0 ? 0 : -10 }]}>
                            <Avatar uri={member.avatar_url} size={22} />
                          </View>
                        ))}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {event.joined_groups.length > 0 && (
                <View style={styles.groupListWrap}>
                  <ThemedText style={styles.groupListTitle}>You are in</ThemedText>
                  {event.joined_groups.map((group) => (
                    <TouchableOpacity
                      key={group.id}
                      activeOpacity={group.community_id ? 0.85 : 1}
                      onPress={() => {
                        if (group.community_id) {
                          router.push({
                            pathname: '/community/[id]',
                            params: { id: String(group.community_id) },
                          } as never);
                        }
                      }}
                      style={styles.groupRow}
                    >
                      <View style={styles.groupTextWrap}>
                        <ThemedText style={styles.groupName}>{group.name}</ThemedText>
                        <ThemedText style={styles.groupMeta}>
                          {group.member_count} member{group.member_count === 1 ? '' : 's'}
                        </ThemedText>
                      </View>
                      <View style={styles.groupAvatars}>
                        {group.members.slice(0, 4).map((member, index) => (
                          <View key={member.id} style={[styles.memberAvatarWrap, { marginLeft: index === 0 ? 0 : -10 }]}>
                            <Avatar uri={member.avatar_url} size={22} />
                          </View>
                        ))}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={styles.createGroupBtn}
                activeOpacity={0.88}
                onPress={() => openCreateGroupModal(event)}
              >
                <ThemedText style={styles.createGroupBtnText}>Create Group</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={isModalOpen} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ThemedText style={styles.modalTitle}>Invite Followers & Following</ThemedText>
            <ThemedText style={styles.modalSubtitle}>
              {selectedEvent ? selectedEvent.title : 'Event'}
            </ThemedText>

            <FlatList
              data={sortedConnections}
              keyExtractor={(item) => `group-member-${item.id}`}
              contentContainerStyle={styles.connectionList}
              renderItem={({ item }) => {
                const selected = selectedMemberIds.includes(item.id);
                return (
                  <TouchableOpacity
                    style={[styles.connectionRow, selected && styles.connectionRowSelected]}
                    onPress={() => toggleMember(item.id)}
                    activeOpacity={0.86}
                  >
                    <Avatar uri={item.avatar_url} size={38} />
                    <View style={styles.connectionMeta}>
                      <ThemedText style={styles.connectionName}>{item.display_name}</ThemedText>
                      <ThemedText style={styles.connectionUsername}>@{item.username}</ThemedText>
                    </View>
                    <View style={styles.connectionRight}>
                      <ThemedText style={styles.connectionRole}>{relationLabel(item)}</ThemedText>
                      <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={selected ? '#7C3AED' : '#A1A1AA'} />
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <ThemedText style={styles.requestsEmpty}>
                  Follow people or get followers to create event groups.
                </ThemedText>
              }
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal} disabled={isCreatingEventGroup}>
                <ThemedText style={styles.cancelBtnText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, isCreatingEventGroup && styles.confirmBtnDisabled]}
                onPress={handleCreateGroup}
                disabled={isCreatingEventGroup}
              >
                {isCreatingEventGroup ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <ThemedText style={styles.confirmBtnText}>Send Requests ({selectedMemberIds.length})</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#18181B',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#71717A',
  },
  eventsScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  eventCard: {
    width: 290,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  eventCover: {
    width: '100%',
    height: 120,
  },
  eventBody: {
    padding: 12,
    gap: 6,
  },
  eventDate: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '700',
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#18181B',
  },
  eventLocation: {
    fontSize: 12,
    color: '#52525B',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventDescription: {
    fontSize: 12,
    color: '#71717A',
    lineHeight: 18,
  },
  groupListWrap: {
    marginTop: 4,
    gap: 6,
  },
  groupListTitle: {
    fontSize: 12,
    color: '#52525B',
    fontWeight: '700',
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    paddingHorizontal: 8,
    paddingVertical: 7,
    backgroundColor: '#FAFAFA',
  },
  groupTextWrap: {
    flex: 1,
    gap: 2,
    paddingRight: 8,
  },
  groupName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#18181B',
  },
  groupMeta: {
    fontSize: 11,
    color: '#71717A',
  },
  groupAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatarWrap: {
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  createGroupBtn: {
    marginTop: 6,
    borderRadius: 10,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
  },
  createGroupBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  requestsEmpty: {
    fontSize: 12,
    color: '#71717A',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(24,24,27,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
    maxHeight: '82%',
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#18181B',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#71717A',
  },
  connectionList: {
    paddingTop: 8,
    paddingBottom: 12,
    gap: 8,
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    padding: 10,
  },
  connectionRowSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#FAF5FF',
  },
  connectionMeta: {
    flex: 1,
    gap: 1,
  },
  connectionName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#18181B',
  },
  connectionUsername: {
    fontSize: 11,
    color: '#71717A',
  },
  connectionRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  connectionRole: {
    fontSize: 11,
    color: '#6D28D9',
    fontWeight: '600',
  },
  connectionCheck: {
    fontSize: 16,
    color: '#6D28D9',
    fontWeight: '800',
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4D4D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    color: '#3F3F46',
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 2,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.7,
  },
  confirmBtnText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '700',
  },
});
