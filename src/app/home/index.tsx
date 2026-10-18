import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  PressableProps,
  ScrollView,
  StatusBar,
  StyleProp,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BottomNav from "../../components/layout/BottomNav";
import colors from "../../constants/colors";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useAppStore } from "../../stores/appStore";

const MAX_WIDTH = 560;
const PAGE_PADDING = 22;
const GRID_GAP = 12;

const tools = [
  {
    titleKey: "records",
    icon: "folder-open-outline" as const,
    route: "/home/records" as const,
  },
  {
    titleKey: "guide",
    icon: "book-outline" as const,
    route: "/home/guide" as const,
  },
  {
    titleKey: "referrals",
    icon: "medkit-outline" as const,
    route: "/home/referrals" as const,
  },
  {
    titleKey: "reminders",
    icon: "calendar-outline" as const,
    route: "/home/reminders" as const,
  },
] as const;

function getGreetingKey() {
  const hour = new Date().getHours();

  if (hour < 12) return "greetingMorning" as const;
  if (hour < 17) return "greetingAfternoon" as const;
  return "greetingEvening" as const;
}

/* ------------------------------ Motion ------------------------------ */

/** Fades a block in while it rises a few pixels, once, on mount. */
function FadeRise({ delay = 0, children }: { delay?: number; children: ReactNode }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 520,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [delay, progress]);

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [18, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

/** A value that eases between 0 and 1 forever. */
function useLoopValue(duration: number) {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [duration, value]);

  return value;
}

/** Slow, soft swell that draws the eye to the main action. */
function GentlePulse({ children }: { children: ReactNode }) {
  const value = useLoopValue(1300);

  return (
    <Animated.View
      style={{
        transform: [
          {
            scale: value.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

/** Slow vertical drift for the banner illustration. */
function Float({ children }: { children: ReactNode }) {
  const value = useLoopValue(2200);

  return (
    <Animated.View
      style={{
        transform: [
          {
            translateY: value.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

type PressableScaleProps = Omit<PressableProps, "style" | "children"> & {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/** Pressable that gives a small spring on touch. */
function PressableScale({ style, children, ...rest }: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const springTo = (toValue: number) =>
    Animated.spring(scale, {
      toValue,
      speed: 40,
      bounciness: 4,
      useNativeDriver: true,
    }).start();

  return (
    <Pressable {...rest} onPressIn={() => springTo(0.96)} onPressOut={() => springTo(1)}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

/* ------------------------------ Screen ------------------------------ */

export default function HomeScreen() {
  const { screenText, t } = useLanguage();
  const { width } = useWindowDimensions();
  const profile = useAppStore((state) => state.caregiverProfile);
  const offlineTipSeen = useAppStore((state) => state.offlineTipSeen);
  const setOfflineTipSeen = useAppStore((state) => state.setOfflineTipSeen);
  const hydrated = useAppStore((state) => state.hydrated);
  const [firstName, setFirstName] = useState("there");
  const [showOfflineTip, setShowOfflineTip] = useState(false);

  const contentWidth = Math.min(width, MAX_WIDTH) - PAGE_PADDING * 2;
  const cardSize = Math.floor((contentWidth - GRID_GAP) / 2);

  async function dismissOfflineTip() {
    setShowOfflineTip(false);
    setOfflineTipSeen(true);
  }

  useFocusEffect(
    useCallback(() => {
      if (!hydrated) return;
      const name = profile?.firstName.trim();
      if (name) setFirstName(name);
      setShowOfflineTip(Boolean(profile) && !offlineTipSeen);
    }, [hydrated, offlineTipSeen, profile]),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <FadeRise>
            <View style={styles.header}>
              <View style={styles.brand}>
                <View style={styles.brandIcon}>
                  <Ionicons name="leaf" size={21} color={colors.white} />
                </View>
                <Text style={styles.brandName}>
                  lumi<Text style={styles.brandAccent}>care</Text>
                </Text>
              </View>

              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Open settings"
                onPress={() => router.push("/home/setting")}
                style={styles.settingsButton}
              >
                <Ionicons name="settings-outline" size={21} color={colors.primary} />
              </PressableScale>
            </View>
          </FadeRise>

          <FadeRise delay={80}>
            <View style={styles.greeting}>
              <Text style={styles.greetingText}>{screenText(getGreetingKey())},</Text>
              <Text style={styles.name} numberOfLines={1}>
                {firstName}
              </Text>
            </View>
          </FadeRise>

          <FadeRise delay={160}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={screenText("screenNewborn")}
              onPress={() => router.push("/home/scan")}
              style={styles.scanBanner}
            >
              <View style={styles.scanGlow} />

              <View style={styles.scanCopy}>
                <Text style={styles.scanTitle}>{screenText("screenNewborn")}</Text>
                <GentlePulse>
                  <View style={styles.scanAction}>
                    <Text style={styles.scanActionText}>{screenText("start")}</Text>
                    <Ionicons name="arrow-forward" size={16} color={colors.primaryDark} />
                  </View>
                </GentlePulse>
              </View>

              <Float>
                <View style={styles.scanIllustration}>
                  <Ionicons name="scan" size={58} color={colors.white} />
                  <View style={styles.scanSmallIcon}>
                    <Ionicons name="heart" size={18} color={colors.primaryDark} />
                  </View>
                </View>
              </Float>
            </PressableScale>
          </FadeRise>

          <FadeRise delay={240}>
            <Text style={styles.sectionTitle}>{screenText("careTools")}</Text>
          </FadeRise>

          <View style={styles.grid}>
            {tools.map((tool, index) => (
              <FadeRise key={tool.titleKey} delay={300 + index * 80}>
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel={t(tool.titleKey)}
                  onPress={() => router.push(tool.route)}
                  style={[styles.toolCard, { width: cardSize, height: cardSize * 0.88 }]}
                >
                  <View style={styles.toolIcon}>
                    <Ionicons name={tool.icon} size={26} color={colors.primary} />
                  </View>
                  <Text style={styles.toolTitle} numberOfLines={1}>
                    {t(tool.titleKey)}
                  </Text>
                </PressableScale>
              </FadeRise>
            ))}
          </View>

          <FadeRise delay={680}>
            <View style={styles.disclaimer}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
              <Text style={styles.disclaimerText}>
                {screenText("homeDisclaimer")}
              </Text>
            </View>
          </FadeRise>
        </ScrollView>

        <BottomNav />
      </View>

      <Modal
        visible={showOfflineTip}
        transparent
        animationType="slide"
        onRequestClose={dismissOfflineTip}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            accessibilityLabel="Close"
            style={StyleSheet.absoluteFill}
            onPress={dismissOfflineTip}
          />

          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="cloud-offline-outline" size={26} color={colors.primary} />
            </View>

            <Text style={styles.modalTitle}>{t("offlineTitle")}</Text>
            <Text style={styles.modalDescription}>
              {t("offlineMessage")}
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={dismissOfflineTip}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>{screenText("offlineGotIt")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/*
  Type scale used across this screen
  display 32/800 · title 25/800 · section 19/800 · button 14/800
  label 14/700 · body 14/500 · caption 12/500
*/
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1 },
  content: {
    width: "100%",
    maxWidth: MAX_WIDTH,
    alignSelf: "center",
    paddingHorizontal: PAGE_PADDING,
    paddingBottom: 32,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    paddingBottom: 18,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: { fontSize: 23, fontWeight: "800", letterSpacing: -1, color: colors.text },
  brandAccent: { color: colors.primary, fontWeight: "500" },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  greeting: { marginBottom: 22 },
  greetingText: { color: colors.muted, fontSize: 16, fontWeight: "500" },
  name: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
    marginTop: 2,
  },

  scanBanner: {
    minHeight: 156,
    borderRadius: 26,
    backgroundColor: colors.primary,
    paddingVertical: 22,
    paddingLeft: 22,
    paddingRight: 14,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 30,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 5,
  },
  scanGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -90,
    right: -60,
  },
  scanCopy: { flex: 1, alignItems: "flex-start", gap: 18 },
  scanTitle: {
    color: colors.white,
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  scanAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: colors.yellow,
  },
  scanActionText: { color: colors.primaryDark, fontSize: 14, fontWeight: "800" },
  scanIllustration: {
    width: 92,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  scanSmallIcon: {
    position: "absolute",
    right: 0,
    bottom: 2,
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.yellow,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 14,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },
  toolCard: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 1,
  },
  toolIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: colors.sageLight,
    alignItems: "center",
    justifyContent: "center",
  },
  toolTitle: { color: colors.text, fontSize: 14, fontWeight: "700" },

  disclaimer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 30,
  },
  disclaimerText: { color: colors.muted, fontSize: 12, fontWeight: "500" },

  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.overlay,
  },
  modalCard: {
    width: "100%",
    maxWidth: MAX_WIDTH,
    alignSelf: "center",
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 28,
    alignItems: "center",
  },
  modalIconWrap: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: colors.sageLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  modalDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 20,
  },
  modalButton: {
    width: "100%",
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonText: { color: colors.white, fontSize: 15, fontWeight: "800" },
});