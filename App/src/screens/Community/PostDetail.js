import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { getPostById, createComment, deletePost, likePost } from "../../services/communityService";
import { API_URL } from "../../utils/config";
import authService from "../../services/authService";

const ACCENT = "#0b0be2ff";
const SCREEN_WIDTH = Dimensions.get('window').width;

const PostDetail = ({ route, navigation }) => {
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionsVisible, setActionsVisible] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likePending, setLikePending] = useState(false);
  const [dislikePending, setDislikePending] = useState(false);
  const [userVote, setUserVote] = useState(null); // 'like' | 'dislike' | null

  const checkUser = async () => {
    try {
      const user = await authService.getUser();
      setCurrentUser(user);
    } catch (e) {
      console.log("Failed to get user", e);
    }
  };

  useEffect(() => {
    checkUser();
    fetchPost();
  }, [postId]);

  // Refetch when the screen gains focus (componentDidFocus equivalent)
  useFocusEffect(
    React.useCallback(() => {
      fetchPost();
    }, [postId])
  );

  const fetchPost = async () => {
    try {
      setLoading(true);
      const data = await getPostById(postId);
      console.log('[DEBUG PostDetail] Received post data:', {
        id: data.id,
        title: data.title,
        image_url: data.image_url,
        images_count: data.images?.length || 0,
        images: data.images
      });
      if (data.images && data.images.length > 0) {
        data.images.forEach((img, idx) => {
          console.log(`[DEBUG PostDetail] Gallery image ${idx}:`, img.image_url);
        });
      } else {
        console.log('[DEBUG PostDetail] No images array, fallback to image_url:', data.image_url);
      }
      setPost(data);
      setLikesCount(data.likes_count || 0);
      setUserVote(null); // Reset on new post
    } catch (error) {
      console.error("Failed to fetch post:", error);
      Alert.alert("Error", "Failed to load post details");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (likePending || userVote === 'like') return;
    try {
      setLikePending(true);
      setUserVote('like');
      setLikesCount((c) => c + 1);
      const res = await likePost(postId, 1);
      if (res.likes_count !== undefined) setLikesCount(res.likes_count);
    } catch (e) {
      setLikesCount((c) => Math.max(0, c - 1));
      setUserVote(null);
      Alert.alert('Error', 'Failed to like post');
    } finally {
      setLikePending(false);
    }
  };

  const handleDislike = async () => {
    if (dislikePending || userVote === 'dislike') return;
    try {
      setDislikePending(true);
      setUserVote('dislike');
      setLikesCount((c) => Math.max(0, c - 1));
      const res = await likePost(postId, -1);
      if (res.likes_count !== undefined) setLikesCount(res.likes_count);
    } catch (e) {
      setUserVote(null);
      Alert.alert('Error', 'Failed to dislike post');
    } finally {
      setDislikePending(false);
    }
  };

  // Build full image URL for gallery items
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    // Remove any leading slash from imageUrl to avoid double slashes
    return `${API_URL.replace(/\/$/, '')}/${imageUrl.replace(/^\//, '')}`;
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 24) {
      return `${diffHours} h ago`;
    } else if (diffDays < 7) {
      return `${diffDays} d ago`;
    }

    return date.toLocaleDateString();
  };

  const handleAddComment = async () => {
    if (commentText.trim().length === 0) return;

    try {
      setSubmitting(true);

      // Backend expects { user_id, content } in body, postId in path
      const commentData = {
        user_id: 1,
        content: commentText.trim(),
      };

      await createComment(postId, commentData);
      setCommentText("");
      
      // Refresh post to get updated comments
      await fetchPost();

      Alert.alert("Success", "Your answer has been posted!");
    } catch (error) {
      console.error("Error creating comment:", error);
      Alert.alert("Error", "Failed to post your answer. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation?.goBack?.()}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation?.goBack?.()}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={{ color: "#6b7280" }}>Post not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation?.goBack?.()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post Details</Text>
        {currentUser && post.user_id === currentUser.id && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setActionsVisible(true)}>
            <Ionicons name="ellipsis-vertical" size={20} color="#111827" />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: "padding", android: undefined })}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Image gallery (multi-image support) */}
          {post.images && post.images.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.galleryScroll}
            >
              {post.images.map((img, idx) => {
                const fullUrl = getImageUrl(img.image_url);
                console.log(`[RENDER] Gallery image ${idx} full URL:`, fullUrl);
                return (
                  <View key={img.id} style={styles.imageWrap}>
                    <Image
                      source={{ uri: fullUrl }}
                      style={styles.postImage}
                      contentFit="cover"
                      cachePolicy="disk"
                      transition={200}
                    />
                  </View>
                );
              })}
            </ScrollView>
          ) : post.image_url ? (
            <View style={styles.imageWrap}>
              <Image
                source={{ uri: getImageUrl(post.image_url) }}
                style={styles.postImage}
                contentFit="cover"
                cachePolicy="disk"
                transition={200}
              />
            </View>
          ) : (
            <View style={styles.imageWrap}>
              <Text style={{ color: '#6b7280', textAlign: 'center', marginTop: 100 }}>
                No image available
              </Text>
            </View>
          )}

          {/* Post content */}
          <View style={styles.contentSection}>
            {/* User info */}
            <View style={styles.userRow}>
              <View style={styles.avatar}>
                <Ionicons name="person-outline" size={20} color={ACCENT} />
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

            {/* Title */}
            <Text style={styles.postTitle}>{post.title}</Text>

            {/* Content */}
            <Text style={styles.postContent}>{post.content}</Text>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.action, userVote === 'like' && { opacity: 0.5 }]}
                activeOpacity={0.8}
                onPress={handleLike}
                disabled={likePending || userVote === 'like'}
              >
                <Ionicons name="thumbs-up-outline" size={22} color={userVote === 'like' ? ACCENT : '#111827'} />
                <Text style={styles.actionLabel}>{likesCount}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.action, userVote === 'dislike' && { opacity: 0.5 }]}
                activeOpacity={0.8}
                onPress={handleDislike}
                disabled={dislikePending || userVote === 'dislike'}
              >
                <Ionicons name="thumbs-down-outline" size={22} color={userVote === 'dislike' ? '#ef4444' : '#111827'} />
                <Text style={styles.actionLabel}>Dislike</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.action} activeOpacity={0.8}>
                <Ionicons name="share-social-outline" size={22} color="#111827" />
                <Text style={styles.actionLabel}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.dividerThick} />

          {/* Comments section */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>
              {post.comments?.length || 0} Answers
            </Text>

            {post.comments && post.comments.length > 0 ? (
              post.comments.map((comment) => (
                <CommentCard key={comment.id} comment={comment} formatTime={formatTime} />
              ))
            ) : (
              <View style={styles.noComments}>
                <Text style={styles.noCommentsText}>
                  No answers yet. Be the first to help!
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Comment input footer */}
        <View style={styles.footer}>
          <View style={styles.inputRow}>
            <View style={styles.avatar}>
              <Ionicons name="person-outline" size={18} color={ACCENT} />
            </View>
            <TextInput
              style={styles.commentInput}
              placeholder="Write your answer..."
              placeholderTextColor="#9ca3af"
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity
              onPress={handleAddComment}
              disabled={commentText.trim().length === 0 || submitting}
              style={[
                styles.sendIcon,
                (commentText.trim().length === 0 || submitting) && { opacity: 0.4 },
              ]}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={ACCENT} />
              ) : (
                <Ionicons name="send" size={20} color={ACCENT} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Actions Sheet */}
      {actionsVisible && (
        <View style={styles.sheetBackdrop}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setActionsVisible(false)} />
          <View style={styles.sheet}>
            <TouchableOpacity
              style={styles.sheetItem}
              onPress={() => {
                setActionsVisible(false);
                navigation.navigate('AskCommunity', { mode: 'edit', post });
              }}
            >
              <Text style={styles.sheetItemText}>Edit Post</Text>
            </TouchableOpacity>
            <View style={styles.sheetDivider} />
            <TouchableOpacity
              style={styles.sheetItem}
              onPress={() => {
                setActionsVisible(false);
                Alert.alert(
                  'Delete Post',
                  'Are you sure you want to delete this post?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          if (!currentUser) return;
                          await deletePost(post.id, currentUser.id, false);
                          Alert.alert('Deleted', 'Post has been deleted');
                          navigation.goBack();
                        } catch (e) {
                          Alert.alert('Error', 'Failed to delete post');
                        }
                      },
                    },
                  ]
                );
              }}
            >
              <Text style={[styles.sheetItemText, { color: '#ef4444' }]}>Delete Post</Text>
            </TouchableOpacity>
            <View style={styles.sheetSpacer} />
            <TouchableOpacity style={styles.sheetCancel} onPress={() => setActionsVisible(false)}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const CommentCard = ({ comment, formatTime }) => {
  return (
    <View style={styles.commentCard}>
      <View style={styles.commentHeader}>
        <View style={styles.avatarSmall}>
          <Ionicons name="person-outline" size={16} color={ACCENT} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.commentUser}>User #{comment.user_id}</Text>
            <Text style={styles.dot}> • </Text>
            <Text style={styles.commentTime}>{formatTime(comment.created_at)}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.commentContent}>{comment.content}</Text>
      
      {/* Comment actions */}
      <View style={styles.commentActions}>
        <TouchableOpacity style={styles.commentAction} activeOpacity={0.8}>
          <Ionicons name="thumbs-up-outline" size={16} color="#6b7280" />
          <Text style={styles.commentActionText}>Helpful</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.commentAction} activeOpacity={0.8}>
          <Ionicons name="chatbubble-outline" size={16} color="#6b7280" />
          <Text style={styles.commentActionText}>Reply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginRight: 36,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Post image
  imageWrap: {
    width: SCREEN_WIDTH,
    height: 250,
    backgroundColor: "#f3f4f6",
  },
  postImage: {
    width: SCREEN_WIDTH,
    height: "100%",
  },
  galleryScroll: {
    width: '100%',
  },

  // Post content
  contentSection: {
    padding: 16,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  userName: {
    color: "#2563eb",
    fontWeight: "700",
    fontSize: 15,
  },
  dot: {
    color: "#6b7280",
  },
  userMeta: {
    color: "#6b7280",
    fontSize: 14,
  },
  timeText: {
    color: "#6b7280",
    fontSize: 13,
    marginTop: 2,
  },

  postTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    lineHeight: 28,
  },
  postContent: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 24,
    marginBottom: 20,
  },

  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    paddingTop: 8,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionLabel: {
    color: "#111827",
    fontWeight: "600",
    fontSize: 14,
  },

  dividerThick: {
    height: 8,
    backgroundColor: "#f3f4f6",
  },

  // Comments
  commentsSection: {
    padding: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },

  noComments: {
    paddingVertical: 40,
    alignItems: "center",
  },
  noCommentsText: {
    color: "#6b7280",
    fontSize: 15,
  },

  commentCard: {
    marginBottom: 20,
    padding: 14,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  commentUser: {
    color: "#2563eb",
    fontWeight: "600",
    fontSize: 14,
  },
  commentTime: {
    color: "#6b7280",
    fontSize: 13,
  },
  commentContent: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
    marginBottom: 10,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  commentAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  commentActionText: {
    color: "#6b7280",
    fontSize: 13,
    fontWeight: "500",
  },

  // Footer input
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    maxHeight: 80,
  },
  sendIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eef2ff",
  },

  // Action sheet styles
  sheetBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: 'rgba(0,0,0,0.2)'
  },
  sheet: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  sheetItem: {
    paddingVertical: 14,
  },
  sheetItemText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
    textAlign: 'center',
  },
  sheetDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  sheetSpacer: { height: 8 },
  sheetCancel: {
    marginTop: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    paddingVertical: 12,
  },
  sheetCancelText: {
    textAlign: 'center',
    color: '#111827',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default PostDetail;
