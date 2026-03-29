import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getAllPosts, searchPosts } from "../../services/communityService";
import { getApiUrl } from "../../utils/config";
import axios from "axios";

const ACCENT = "#0b0be2ff";

const filtersData = [
  { key: "wheat", label: "Wheat", emoji: "🌾" },
  { key: "barley", label: "Barley", emoji: "🌾" },
  { key: "rice", label: "Rice", emoji: "🌾" },
  { key: "maize", label: "Maize", emoji: "🌽" },
];

const Community = ({ navigation }) => {
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState([]);
  const [posts, setPosts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [serverBaseUrl, setServerBaseUrl] = React.useState(null);

  // Fetch posts on mount
  React.useEffect(() => {
    fetchPosts();
    loadServerBaseUrl();
  }, []);

  // Refresh posts when screen comes into focus
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchPosts();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const baseUrl = await getApiUrl();
      console.log('Fetching posts from:', baseUrl);
      const data = await getAllPosts(0, 20);
      console.log('[DEBUG Community] Fetched posts:', data.length);
      if (data.length > 0) {
        console.log('[DEBUG Community] First post images:', data[0].images);
      }
      setPosts(data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      if (error.response) {
         console.error('Error Status:', error.response.status);
         console.error('Error Data:', error.response.data);
      } else if (error.request) {
          console.error('No response received:', error.request);
      } else {
          console.error('Error Config:', error.message);
      }
      // You can add error handling UI here
    } finally {
      setLoading(false);
    }
  };

  const loadServerBaseUrl = async () => {
    try {
      const url = await getApiUrl();
      setServerBaseUrl(url);
    } catch (error) {
      console.warn('Failed to load server base URL for Community screen:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const onSearch = async () => {
    if (query.trim().length === 0) {
      fetchPosts();
      return;
    }
    try {
      setLoading(true);
      const data = await searchPosts(query.trim());
      setPosts(data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (key) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top search + actions */}
      <View style={styles.topRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#6b7280" />
          <TextInput
            placeholder="Search in Community"
            placeholderTextColor="#9ca3af"
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={onSearch}
          />
        </View>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8}>
          <Ionicons name="notifications-outline" size={22} color="#111827" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8}>
          <Ionicons name="ellipsis-vertical" size={20} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Filter header */}
        <View style={styles.filterHeader}>
          <Text style={styles.filterTitle}>Filter by</Text>
          <TouchableOpacity activeOpacity={0.8}>
            <Text style={styles.changeLink}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {filtersData.map((f) => {
            const active = selected.includes(f.key);
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => toggleFilter(f.key)}
                activeOpacity={0.8}
              >
                <Text style={styles.chipEmoji}>{f.emoji}</Text>
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Loading indicator */}
        {loading && (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={ACCENT} />
          </View>
        )}

        {/* Posts */}
        {!loading && posts.length === 0 && (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <Text style={{ color: '#6b7280', fontSize: 16 }}>No posts found</Text>
          </View>
        )}

        {!loading && posts.map((post) => (
          <PostCard key={post.id} post={post} navigation={navigation} serverBaseUrl={serverBaseUrl} />
        ))}
      </ScrollView>
      
      {/* Floating Ask button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.9}
        onPress={() => navigation.navigate("AskCommunity")}
      >
        <Ionicons name="create-outline" size={20} color="#fff" />
        <Text style={styles.fabLabel}>Ask Community</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const PostCard = ({ post, navigation, serverBaseUrl }) => {
  // Format the date
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 24) {
      return `${diffHours} h`;
    } else if (diffDays < 7) {
      return `${diffDays} d`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const commentCount = post.comments ? post.comments.length : 0;

  // Build full image URL (handles relative paths from backend)
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1600&auto=format&fit=crop";
    if (imageUrl.startsWith('http')) return imageUrl;
    const baseUrl = serverBaseUrl || '';
    return `${baseUrl.replace(/\/$/, '')}/${String(imageUrl).replace(/^\//, '')}`;
  };

  // Determine primary image (first of images[] if present, else legacy image_url)
  const primaryImage = post.images && post.images.length > 0 ? post.images[0].image_url : post.image_url;
  const multipleCount = post.images && post.images.length > 1 ? post.images.length : 0;

  return (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => navigation?.navigate('PostDetail', { postId: post.id })}
    >
      {/* Image - using placeholder if no image */}
      <View style={styles.cardImageWrap}>
        <Image
          source={{ uri: getImageUrl(primaryImage) }}
          style={styles.cardImage}
          contentFit="cover"
          cachePolicy="disk"
          transition={200}
        />
        {multipleCount > 0 && (
          <View style={styles.multiBadge}>
            <Ionicons name="images-outline" size={14} color="#fff" />
            <Text style={styles.multiBadgeText}>{multipleCount}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        {/* User row */}
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={18} color={ACCENT} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>User #{post.user_id}</Text>
              <Text style={styles.dot}> • </Text>
              <Text style={styles.userMeta}>India</Text>
            </View>
            <Text style={styles.timeText}>{formatTime(post.created_at)}</Text>
          </View>
        </View>

        {/* Post text */}
        <Text numberOfLines={1} style={styles.postTitle}>
          {post.title}
        </Text>
        <Text numberOfLines={2} style={styles.postBody}>{post.content}</Text>

        {/* Translate / answers */}
        <View style={styles.metaRow}>
          <Text style={styles.translate}>View Details</Text>
          <Text style={styles.answers}>{commentCount} {commentCount === 1 ? 'answer' : 'answers'}</Text>
        </View>

        <View style={styles.divider} />

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.action} activeOpacity={0.8}>
            <Ionicons name="thumbs-up-outline" size={20} color="#111827" />
            <Text style={styles.actionCount}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.action, { marginLeft: 18 }]} activeOpacity={0.8}>
            <Ionicons name="thumbs-down-outline" size={20} color="#111827" />
            <Text style={styles.actionCount}>0</Text>
          </TouchableOpacity>

          <View style={{ flex: 1 }} />

          <TouchableOpacity style={styles.action} activeOpacity={0.8}>
            <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  // Top bar
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#111827",
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  // Filters
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingHorizontal: 16,
    marginTop: 8,
  },
  filterTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  changeLink: { color: ACCENT, fontWeight: "700" },
  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.2,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 22,
    marginRight: 10,
  },
  chipActive: {
    borderColor: ACCENT,
    backgroundColor: "#eef2ff",
  },
  chipEmoji: { fontSize: 16, marginRight: 8 },
  chipLabel: { fontSize: 14, color: "#111827", fontWeight: "600" },
  chipLabelActive: { color: ACCENT },

  // Card
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cardImageWrap: {
    width: "100%",
    height: 190,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  multiBadge: {
    position: 'absolute',
    right: 10,
    top: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
  },
  multiBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  cardContent: {
    padding: 14,
  },

  userRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  nameRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  userName: { color: "#2563eb", fontWeight: "700", fontSize: 14 },
  dot: { color: "#6b7280" },
  userMeta: { color: "#6b7280", fontSize: 14 },
  timeText: { color: "#6b7280", fontSize: 12, marginTop: 2 },

  postTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginTop: 6,
  },
  postBody: { fontSize: 14, color: "#374151", marginTop: 6 },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  translate: { color: "#6b7280", fontSize: 14 },
  answers: { color: "#6b7280", fontSize: 14 },

  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginTop: 12,
    marginBottom: 8,
  },

  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  action: { flexDirection: "row", alignItems: "center" },
  actionCount: { marginLeft: 6, color: "#111827" },

  // FAB
  fab: {
    position: "absolute",
    right: 16,
    bottom: 24,
    backgroundColor: ACCENT,
    borderRadius: 28,
    height: 56,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabLabel: { color: "#fff", fontWeight: "700", fontSize: 16 },
});

export default Community;