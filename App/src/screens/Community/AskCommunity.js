import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { createPost, updatePost } from "../../services/communityService";
import authService from "../../services/authService";

const ACCENT = "#0b0be2ff";
const MAX_TITLE = 200;
const MAX_DESC = 2500;

const CROP_OPTIONS = ["Wheat", "Barley", "Rice", "Maize", "Cotton", "Paddy"];

const AskCommunity = ({ navigation, route }) => {
  const [images, setImages] = useState([]);
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [crop, setCrop] = useState(null);
  const [cropModal, setCropModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = route?.params?.mode === 'edit';
  const editingPost = route?.params?.post;

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        console.warn("Permission to access media library is required!");
      }
    })();
  }, []);

  // Prefill fields in edit mode
  useEffect(() => {
    if (isEdit && editingPost) {
      setQuestion(editingPost.title || "");
      setDescription(editingPost.content || "");
      // Optional: preload existing image as preview (read-only)
      if (editingPost.image_url) {
        // Show preview using full URL; users can add a new image to replace on update if desired
        setImages([{ uri: editingPost.image_url }]);
      }
    }
  }, [isEdit, editingPost]);

  const onPickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 5,
        quality: 0.8,
      });
      if (!result.canceled) {
        const picked = result.assets ?? [result];
        setImages((prev) => [...prev, ...picked.map((a) => ({ uri: a.uri }))]);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const removeImage = (uri) => {
    setImages((prev) => prev.filter((img) => img.uri !== uri));
  };

  const valid = question.trim().length > 0;

  const onSend = async () => {
    if (!valid) return;

    try {
      setSubmitting(true);
      const user = await authService.getUser();
      if (!user || !user.id) {
        Alert.alert('Error', 'You must be logged in to post.');
        return;
      }

      const payload = {
        user_id: user.id,
        title: question.trim(),
        content: (description.trim() || question.trim()),
      };

      if (isEdit && editingPost?.id) {
        // Update title/content; keep image unchanged for now
        await updatePost(editingPost.id, { title: payload.title, content: payload.content }, user.id, false);
        Alert.alert('Updated', 'Your post has been updated!', [
          { text: 'OK', onPress: () => navigation?.goBack?.() },
        ]);
      } else {
        // Create new post; attach all selected images
        const imageUris = images.map(i => i.uri);
        await createPost(payload, imageUris);
        Alert.alert('Success', 'Your question has been posted to the community!', [
          { text: 'OK', onPress: () => navigation?.goBack?.() },
        ]);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert(
        'Error',
        isEdit ? 'Failed to update your post. Please try again.' : 'Failed to post your question. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false);
    }
  };

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
        <Text style={styles.headerTitle}>Ask Community</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: "padding", android: undefined })}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Add image */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.addImageBtn}
              onPress={onPickImage}
              activeOpacity={0.9}
            >
              <Ionicons
                name="image-outline"
                size={18}
                color="#111827"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.addImageText}>Add image</Text>
            </TouchableOpacity>

            {/* Preview */}
            {images.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 12 }}
              >
                {images.map((img) => (
                  <View key={img.uri} style={styles.previewWrap}>
                    <Image source={{ uri: img.uri }} style={styles.previewImg} />
                    <Pressable style={styles.removeBadge} onPress={() => removeImage(img.uri)}>
                      <Ionicons name="close" size={14} color="#fff" />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            )}

            <Text style={styles.helperText}>
              Improve the probability of receiving the right answer
            </Text>

            {/* Add crop */}
            <TouchableOpacity
              style={[styles.addImageBtn, { marginTop: 6 }]}
              onPress={() => setCropModal(true)}
              activeOpacity={0.9}
            >
              <Text style={styles.addImageText}>{crop ? crop : "Add crop"}</Text>
              {crop && (
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color="#111827"
                  style={{ marginLeft: 6 }}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Question */}
          <View style={styles.section}>
            <Text style={styles.label}>Your question to the community</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={[styles.input, { height: 110 }]}
                placeholder="Add a question indicating what’s wrong with your crop"
                placeholderTextColor="#6b7280"
                multiline
                value={question}
                onChangeText={(t) =>
                  setQuestion(t.length <= MAX_TITLE ? t : t.slice(0, MAX_TITLE))
                }
                textAlignVertical="top"
              />
            </View>
            <Text style={styles.counter}>
              {question.length} / {MAX_TITLE} Characters
            </Text>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Description of your problem</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={[styles.input, { height: 170 }]}
                placeholder="Describe specialities such as change of leaves, root colour, bugs, tears..."
                placeholderTextColor="#6b7280"
                multiline
                value={description}
                onChangeText={(t) =>
                  setDescription(t.length <= MAX_DESC ? t : t.slice(0, MAX_DESC))
                }
                textAlignVertical="top"
              />
            </View>
            <Text style={styles.counter}>
              {description.length} / {MAX_DESC} Characters
            </Text>
          </View>
        </ScrollView>

        {/* Sticky footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={onSend}
            activeOpacity={0.9}
            style={[styles.sendBtn, (!valid || submitting) && { opacity: 0.5 }]}
            disabled={!valid || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendLabel}>{isEdit ? 'Update' : 'Send'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Crop selector modal */}
      <Modal visible={cropModal} transparent animationType="slide">
        <Pressable style={styles.modalBackdrop} onPress={() => setCropModal(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select crop</Text>
            <TouchableOpacity onPress={() => setCropModal(false)}>
              <Ionicons name="close" size={22} color="#111827" />
            </TouchableOpacity>
          </View>
          <View style={styles.cropGrid}>
            {CROP_OPTIONS.map((c) => {
              const active = crop === c;
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.cropChip, active && styles.cropChipActive]}
                  onPress={() => setCrop(c)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.cropText, active && styles.cropTextActive]}>{c}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            style={[styles.sheetDone, { backgroundColor: ACCENT }]}
            onPress={() => setCropModal(false)}
            activeOpacity={0.9}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>Done</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  // Header
  header: {
    backgroundColor: "#f3f4f6",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
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
    marginRight: 36, // to visually center title since back icon takes space
  },

  // Sections
  section: { paddingHorizontal: 16, paddingTop: 16 },

  addImageBtn: {
    alignSelf: "flex-start",
    borderWidth: 1.2,
    borderColor: "#d1d5db",
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
  },
  addImageText: { color: "#111827", fontWeight: "600" },

  helperText: {
    color: "#4b5563",
    marginTop: 14,
    marginBottom: 8,
  },

  previewWrap: {
    width: 90,
    height: 90,
    borderRadius: 10,
    overflow: "hidden",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  previewImg: { width: "100%", height: "100%" },
  removeBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },

  label: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 8 },
  inputWrap: {
    borderWidth: 1.2,
    borderColor: "#d1d5db",
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  input: {
    padding: 12,
    fontSize: 15,
    color: "#111827",
  },
  counter: {
    textAlign: "right",
    color: "#6b7280",
    marginTop: 6,
    marginRight: 6,
  },

  // Footer
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  sendBtn: {
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ACCENT,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  sendLabel: { color: "#fff", fontSize: 18, fontWeight: "700" },

  // Modal sheet
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
  modalSheet: {
    backgroundColor: "#fff",
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  cropGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 6,
  },
  cropChip: {
    borderWidth: 1.2,
    borderColor: "#d1d5db",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: "#fff",
  },
  cropChipActive: {
    borderColor: ACCENT,
    backgroundColor: "#eef2ff",
  },
  cropText: { color: "#111827", fontWeight: "600" },
  cropTextActive: { color: ACCENT },
  sheetDone: {
    marginTop: 16,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default AskCommunity;