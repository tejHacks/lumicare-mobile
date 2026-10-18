import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppButton from "../../components/ui/AppButton";
import colors from "../../constants/colors";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useAppStore } from "../../stores/appStore";

export default function ProfileScreen() {
  const { t, profileText } = useLanguage();
  const saveProfile = useAppStore((state) => state.setCaregiverProfile);
  const setOfflineTipSeen = useAppStore((state) => state.setOfflineTipSeen);
  const { height } = useWindowDimensions();
  const compact = height < 700;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const lastNameRef = useRef<TextInput>(null);

  // After the keyboard animates in, nudge the scroll view so the
  // focused field and the button stay visible.
  function revealFields() {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 250);
  }

  async function continueToApp() {
    if (saving) return;

    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert(
        "A little introduction",
        "Please enter your first name and last name to continue.",
      );
      return;
    }

    try {
      setSaving(true);

      saveProfile({ firstName: firstName.trim(), lastName: lastName.trim() });
      setOfflineTipSeen(false);

      router.replace("/home");
    } catch {
      Alert.alert(
        "Couldn't save your profile",
        "Please try again. Your information has not been confirmed as saved.",
      );
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* "padding" on BOTH platforms: Android's default resize doesn't apply
          with edge-to-edge, so behavior={undefined} leaves the keyboard on top
          of the inputs. */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={[styles.page, compact && styles.pageCompact]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.back}
          >
            <Ionicons name="arrow-back" size={21} color={colors.primary} />
          </Pressable>

          <View style={[styles.iconCircle, compact && styles.iconCircleCompact]}>
            <Ionicons name="person-outline" size={34} color={colors.primary} />
          </View>

          <Text style={styles.eyebrow}>LET&apos;S GET TO KNOW YOU</Text>
          <Text style={[styles.title, compact && styles.titleCompact]}>
            {profileText("prompt")}
          </Text>
          <Text style={styles.description}>
            {profileText("intro")}
          </Text>

          <View style={[styles.form, compact && styles.formCompact]}>
            <View style={styles.field}>
              <Text style={styles.label}>{profileText("firstName")}</Text>
              <TextInput
                accessibilityLabel="First name"
                value={firstName}
                onChangeText={setFirstName}
                onFocus={revealFields}
                onSubmitEditing={() => lastNameRef.current?.focus()}
                placeholder="e.g. Olateju"
                placeholderTextColor="#9AA59B"
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
                blurOnSubmit={false}
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{profileText("lastName")}</Text>
              <TextInput
                ref={lastNameRef}
                accessibilityLabel="Last name"
                value={lastName}
                onChangeText={setLastName}
                onFocus={revealFields}
                onSubmitEditing={continueToApp}
                placeholder="e.g. Emmanuel"
                placeholderTextColor="#9AA59B"
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.privacyNote}>
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={colors.primary}
            />
            <Text style={styles.privacyText}>
              Your profile stays on this device for now. You can use
              LumiCare&apos;s core screening tools without creating an online
              account.
            </Text>
          </View>

          <View style={styles.bottom}>
            <AppButton
              title={saving ? t("loading") : t("continue")}
              onPress={continueToApp}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  page: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 25,
    paddingTop: 12,
    paddingBottom: 28,
  },
  pageCompact: {
    paddingBottom: 16,
  },
  back: {
    width: 43,
    height: 43,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 25,
    backgroundColor: colors.sage,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    marginBottom: 27,
  },
  iconCircleCompact: {
    width: 64,
    height: 64,
    borderRadius: 21,
    marginTop: 20,
    marginBottom: 18,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  title: {
    fontSize: 33,
    lineHeight: 39,
    letterSpacing: -1,
    color: colors.text,
    fontWeight: "800",
    marginBottom: 12,
  },
  titleCompact: {
    fontSize: 27,
    lineHeight: 33,
  },
  description: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 23,
  },
  form: {
    gap: 19,
    marginTop: 35,
  },
  formCompact: {
    gap: 14,
    marginTop: 22,
  },
  field: {
    gap: 9,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  input: {
    height: 57,
    paddingHorizontal: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 15,
  },
  privacyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#EAF0E5",
    padding: 14,
    borderRadius: 15,
    marginTop: 25,
  },
  privacyText: {
    flex: 1,
    color: colors.primaryDark,
    fontSize: 12,
    lineHeight: 19,
  },
  bottom: {
    marginTop: "auto",
    paddingTop: 32,
  },
});