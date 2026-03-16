import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { CommunityCard } from '@/components/community/CommunityCard';
import { useCommunityStore } from '@/store/communityStore';

type Tab = 'my' | 'discover';

export default function CommunityScreen() {
  const router = useRouter();
  const { communities, isMembersLoading, fetchCommunities, fetchMyCommunities, joinCommunity } =
    useCommunityStore();
  const [activeTab, setActiveTab] = useState<Tab>('my');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCommunities();
    fetchMyCommunities();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCommunities();
    setRefreshing(false);
  };

  const handleJoin = async (communityId: number) => {
    try {
      await joinCommunity(communityId);
    } catch {
      Alert.alert('Error', 'Could not join the community. Please try again.');
    }
  };

  const filtered = communities.filter((c) => {
    const matchSearch =
      !search.trim() ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchTab = activeTab === 'my' ? c.is_member : !c.is_member;
    return matchSearch && matchTab;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>🐾 Communities</ThemedText>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => router.push('/create-community')}
        >
          <ThemedText style={styles.createBtnText}>+ New</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <ThemedText style={styles.searchIcon}>🔍</ThemedText>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search communities…"
          placeholderTextColor="#A1A1AA"
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
            <ThemedText style={styles.clearText}>✕</ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['my', 'discover'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <ThemedText style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'my' ? '✅ My Communities' : '🌐 Discover'}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => `community-${item.id}`}
        renderItem={({ item }) => (
          <CommunityCard
            community={item}
            onJoin={!item.is_member ? () => handleJoin(item.id) : undefined}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />
        }
        ListEmptyComponent={
          !isMembersLoading ? (
            <View style={styles.empty}>
              <ThemedText style={styles.emptyEmoji}>
                {activeTab === 'my' ? '🏘️' : '🌍'}
              </ThemedText>
              <ThemedText style={styles.emptyTitle}>
                {activeTab === 'my' ? 'No communities yet' : 'No results'}
              </ThemedText>
              <ThemedText style={styles.emptySubtext}>
                {activeTab === 'my'
                  ? 'Join breed communities to connect with other pet owners'
                  : 'Try a different search term'}
              </ThemedText>
            </View>
          ) : null
        }
        ListFooterComponent={isMembersLoading ? <ActivityIndicator color="#7C3AED" style={styles.loader} /> : null}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9F9FB' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E4E7',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#18181B' },
  createBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  createBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#E4E4E7',
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 15,
    color: '#18181B',
  },
  clearBtn: { padding: 4 },
  clearText: { fontSize: 14, color: '#A1A1AA' },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
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
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#18181B' },
  emptySubtext: { fontSize: 14, color: '#71717A', textAlign: 'center', lineHeight: 20 },
  loader: { paddingVertical: 20 },
});
