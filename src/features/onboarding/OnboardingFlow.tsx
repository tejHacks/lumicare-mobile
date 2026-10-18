import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import AppButton from "../../components/ui/AppButton";
import ProgressDots from "../../components/ui/ProgressDots";
import colors from "../../constants/colors";
import { LANGUAGES } from "../../constants/languages";
import { useLanguage } from "../../i18n/LanguageProvider";

const slides = [
  {
    eyebrow: "A GENTLER START",
    title: "Little lives.\nA brighter future.",
    description:
      "Thoughtful newborn care tools to help families and health workers take the next step with confidence.",
    icon: "heart" as const,
    iconTwo: "leaf" as const,
    tag: "Care begins with awareness",
  },
  {
    eyebrow: "CARE WITHOUT BARRIERS",
    title: "Care that goes\nwhere you go.",
    description:
      "Keep essential care information and saved records close, even when the internet isn't available.",
    icon: "phone-portrait" as const,
    iconTwo: "cloud-offline" as const,
    tag: "Designed for offline access",
  },
  {
    eyebrow: "NOTICE. ACT. FOLLOW UP.",
    title: "Every little sign\nmatters.",
    description:
      "Explore the neonatal jaundice screening workflow and learn when a baby needs prompt professional assessment.",
    icon: "shield-checkmark" as const,
    iconTwo: "medical" as const,
    tag: "Supporting informed next steps",
  },
];

// The hero illustration is designed on a fixed canvas, then scaled to fit.
const ART_W = 300;
const ART_H = 260;
const MAX_CONTENT_WIDTH = 560;

export default function OnboardingFlow() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { languageCode, setLanguage, t } = useLanguage();

  const [step, setStep] = useState(0);
  const [languageOpen, setLanguageOpen] = useState(false);

  const current = slides[step];
  const isLast = step === slides.length - 1;
  const language =
    LANGUAGES.find((item) => item.code === languageCode) ?? LANGUAGES[0];

  // ---- Responsive sizing ----
  const usableWidth = Math.min(width, MAX_CONTENT_WIDTH) - 48;
  const compact = height < 700; // small / short phones
  const tiny = height < 600 || width < 340;

  // Hero gets a share of the screen height; shrinks on the last slide
  // (which has the extra safety note) and on short screens.
  const heroShare = isLast ? (compact ? 0.22 : 0.26) : compact ? 0.28 : 0.33;
  const heroHeight = Math.round(
    Math.min(330, Math.max(tiny ? 120 : 150, height * heroShare)),
  );
  const artScale = Math.min(1, heroHeight / ART_H, usableWidth / ART_W);

  const titleSize = tiny ? 26 : compact ? 30 : width < 360 ? 32 : 37;
  const titleLine = Math.round(titleSize * 1.17);
  const descSize = compact ? 14 : 15;
  const descLine = compact ? 21 : 24;

  function next() {
    if (step < slides.length - 1) {
      setStep((previous) => previous + 1);
      return;
    }

    router.replace("/profile");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.page}>
        <View style={styles.topBar}>
          <View style={styles.brand}>
            <View style={styles.brandIcon}>
              <Ionicons name="leaf" size={20} color={colors.white} />
            </View>
            <Text style={styles.brandName}>
              lumi<Text style={styles.brandAccent}>care</Text>
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("chooseLanguage")}
            onPress={() => setLanguageOpen(true)}
            style={styles.languageButton}
          >
            <Ionicons name="globe-outline" size={18} color={colors.primary} />
            <Text style={styles.languageLabel}>
              {language.code.toUpperCase()}
            </Text>
            <Ionicons name="chevron-down" size={14} color={colors.primary} />
          </Pressable>
        </View>

        {/* HERO: fixed height computed from the screen, never flexes into content */}
        <View style={[styles.hero, { height: heroHeight }]}>
          <View style={styles.decorCircleOne} />
          <View style={styles.decorCircleTwo} />

          <View
            style={[styles.illustration, { transform: [{ scale: artScale }] }]}
          >
            <View style={styles.sun}>
              <Ionicons name="sunny" size={26} color="#D9A441" />
            </View>

            <View style={styles.orbit}>
              <View style={styles.orbitDot} />
              <View style={styles.orbitDotTwo} />
            </View>

            <View style={styles.mainArt}>
              <View style={styles.artLeafLeft}>
                <Ionicons name={current.iconTwo} size={38} color="#648C68" />
              </View>

              <View style={styles.babyCircle}>
                <Ionicons
                  name={current.icon}
                  size={68}
                  color={colors.primary}
                />
              </View>

              <View style={styles.artLeafRight}>
                <Ionicons name="sparkles" size={29} color="#D2A34B" />
              </View>
            </View>

            <View style={styles.artPill}>
              <View style={styles.pillDot} />
              <Text style={styles.artPillText}>{current.tag}</Text>
            </View>

            <View style={styles.ground} />
          </View>
        </View>

        {/* CONTENT: takes the remaining space and scrolls if it ever can't fit,
            so it can no longer overlap the dots or buttons */}
        <ScrollView
          key={step}
          style={styles.contentScroll}
          contentContainerStyle={[
            styles.content,
            { paddingTop: compact ? 14 : 22 },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.eyebrowRow}>
            <View style={styles.eyebrowLine} />
            <Text style={styles.eyebrow}>{current.eyebrow}</Text>
          </View>

          <Text
            style={[
              styles.title,
              {
                fontSize: titleSize,
                lineHeight: titleLine,
                marginBottom: compact ? 8 : 12,
              },
            ]}
          >
            {current.title}
          </Text>
          <Text
            style={[
              styles.description,
              { fontSize: descSize, lineHeight: descLine },
            ]}
          >
            {current.description}
          </Text>

          {isLast && (
            <View style={styles.safetyNote}>
              <Ionicons
                name="information-circle-outline"
                size={17}
                color={colors.primary}
              />
              <Text style={styles.safetyText}>
                LumiCare supports screening and follow-up. It does not replace
                a healthcare professional&apos;s assessment.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* BOTTOM: always pinned, never shrinks */}
        <View style={[styles.bottom, { gap: compact ? 10 : 15 }]}>
          <ProgressDots current={step} total={slides.length} />

          <AppButton
            title={isLast ? t("saveProfile") : t("continue")}
            onPress={next}
            style={styles.primaryButton}
          />

          {step > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setStep((previous) => previous - 1)}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={17} color={colors.primary} />
              <Text style={styles.backText}>{t("cancel")}</Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => setStep(2)}
              style={styles.skipButton}
            >
              <Text style={styles.skipText}>Skip introduction</Text>
              <Ionicons name="arrow-forward" size={15} color={colors.muted} />
            </Pressable>
          )}
        </View>
      </View>

      <Modal
        visible={languageOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setLanguageOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            accessibilityLabel="Close language selector"
            style={StyleSheet.absoluteFill}
            onPress={() => setLanguageOpen(false)}
          />

          <View
            style={[
              styles.languageSheet,
              { paddingBottom: Math.max(28, insets.bottom + 12) },
            ]}
          >
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeading}>
                <Text style={styles.sheetTitle}>{t("chooseLanguage")}</Text>
                <Text style={styles.sheetDescription}>
                  More African languages are coming.
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={() => setLanguageOpen(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.languageList}
            >
              {LANGUAGES.map((item) => {
                const selected = item.code === languageCode;

                return (
                  <Pressable
                    key={item.code}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      void setLanguage(item.code);
                      setLanguageOpen(false);
                    }}
                    style={[
                      styles.languageOption,
                      selected && styles.selectedLanguageOption,
                    ]}
                  >
                    <View style={styles.languageOptionText}>
                      <Text
                        style={[
                          styles.languageName,
                          selected && styles.selectedLanguageName,
                        ]}
                      >
                        {item.nativeName}
                      </Text>
                      <Text style={styles.languageRegion}>
                        {item.name} · {item.region}
                      </Text>
                    </View>

                    {selected ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={23}
                        color={colors.primary}
                      />
                    ) : (
                      <View style={styles.unselectedCircle} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.translationNote}>
              The interface currently uses English text. Full translations
              will be added language by language.
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  page: {
    flex: 1,
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: "center",
    paddingHorizontal: 24,
  },
  topBar: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  brandIcon: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    fontSize: 22,
    letterSpacing: -1,
    fontWeight: "800",
    color: colors.text,
  },
  brandAccent: {
    color: colors.primary,
    fontWeight: "500",
  },
  languageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  languageLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  hero: {
    marginTop: 8,
    borderRadius: 30,
    backgroundColor: colors.sageLight,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  decorCircleOne: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 110,
    backgroundColor: "#E2EDE0",
    top: -95,
    right: -48,
  },
  decorCircleTwo: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 80,
    backgroundColor: "#E8EEDD",
    bottom: -65,
    left: -40,
  },
  // Fixed design canvas; scaled from the component.
  illustration: {
    width: ART_W,
    height: ART_H,
    alignItems: "center",
    justifyContent: "center",
  },
  sun: {
    position: "absolute",
    top: "13%",
    right: "21%",
    width: 47,
    height: 47,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F0D7",
  },
  orbit: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 110,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#C6D8C2",
    alignItems: "center",
    justifyContent: "center",
  },
  orbitDot: {
    position: "absolute",
    top: 23,
    left: 24,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#D6A94D",
  },
  orbitDotTwo: {
    position: "absolute",
    bottom: 28,
    right: 19,
    width: 8,
    height: 8,
    borderRadius: 5,
    backgroundColor: "#7CA184",
  },
  mainArt: {
    width: 205,
    height: 150,
    alignItems: "center",
    justifyContent: "center",
  },
  babyCircle: {
    width: 116,
    height: 116,
    borderRadius: 60,
    backgroundColor: "#FFFFFF",
    borderWidth: 7,
    borderColor: "#D9E7D4",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#274B36",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.09,
    shadowRadius: 14,
    elevation: 4,
  },
  artLeafLeft: {
    position: "absolute",
    left: -2,
    bottom: 10,
    transform: [{ rotate: "-25deg" }],
  },
  artLeafRight: {
    position: "absolute",
    right: 0,
    top: 5,
  },
  artPill: {
    position: "absolute",
    bottom: "13%",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7EDE2",
  },
  pillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#7E9F69",
  },
  artPillText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "600",
  },
  ground: {
    position: "absolute",
    width: 175,
    height: 14,
    borderRadius: 50,
    bottom: "7%",
    backgroundColor: "#DDE8D8",
  },
  contentScroll: {
    flex: 1,
    minHeight: 0,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: 10,
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 12,
  },
  eyebrowLine: {
    width: 23,
    height: 2,
    backgroundColor: "#83A16F",
    borderRadius: 2,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.8,
  },
  title: {
    letterSpacing: -1.5,
    fontWeight: "800",
    color: colors.text,
  },
  description: {
    color: colors.muted,
    maxWidth: 360,
  },
  safetyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 12,
    backgroundColor: "#EAF0E5",
    marginTop: 10,
  },
  safetyText: {
    flex: 1,
    color: colors.primaryDark,
    fontSize: 11,
    lineHeight: 16,
  },
  bottom: {
    paddingTop: 8,
    paddingBottom: 10,
  },
  primaryButton: {
    width: "100%",
  },
  skipButton: {
    height: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  skipText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  backButton: {
    height: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  backText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 31, 23, 0.42)",
  },
  languageSheet: {
    maxHeight: "82%",
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: "center",
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 3,
    backgroundColor: "#CDD5CA",
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  sheetHeading: {
    flex: 1,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  sheetDescription: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 5,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  languageList: {
    gap: 9,
    paddingBottom: 12,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 67,
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  selectedLanguageOption: {
    borderColor: colors.primary,
    backgroundColor: "#EDF3E9",
  },
  languageOptionText: {
    flex: 1,
    gap: 4,
  },
  languageName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  selectedLanguageName: {
    color: colors.primary,
  },
  languageRegion: {
    color: colors.muted,
    fontSize: 11,
  },
  unselectedCircle: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#CBD4C9",
  },
  translationNote: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 10,
  },
});