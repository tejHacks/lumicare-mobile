import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BottomNav from "../../components/layout/BottomNav";
import { FadeRise, PressableScale } from "../../components/ui/Motion";
import colors from "../../constants/colors";
import { LANGUAGES } from "../../constants/languages";
import { countScreenings, getAllScreenings } from "../../db/database";
import { useLanguage } from "../../i18n/LanguageProvider";

const MAX_WIDTH = 560;
const PAGE_PADDING = 22;

export default function SettingsScreen() {
  const { languageCode, setLanguage, t, screenText } = useLanguage();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [storageCount, setStorageCount] = useState(0);
  const [exporting, setExporting] = useState(false);

  const language =
    LANGUAGES.find((item) => item.code === languageCode) ?? LANGUAGES[0];

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadSettings() {
        try {
          if (!active) return;
          setStorageCount(await countScreenings());
        } catch {
          // Keep safe defaults if local storage is unavailable.
        }
      }

      void loadSettings();

      return () => {
        active = false;
      };
    }, []),
  );

  async function chooseLanguage(code: string) {
    try {
      await setLanguage(code);
      setLanguageOpen(false);
    } catch {
      Alert.alert("Unable to save", "Your language preference could not be saved.");
    }
  }

  async function exportRecords() {
    if (exporting) return;

    try {
      setExporting(true);

      const records = await getAllScreenings();
      if (records.length === 0) {
        Alert.alert(t("noRecords"), screenText("exportDescription"));
        return;
      }

      await Share.share({
        title: "LumiCare screening records",
        message: JSON.stringify(
          {
            app: "LumiCare",
            exportVersion: 1,
            exportedAt: new Date().toISOString(),
            records: records.map(({ imagePath: _imagePath, ...record }) => record),
          },
          null,
          2,
        ),
      });
    } catch {
      Alert.alert(screenText("exportRecords"), screenText("preparingExport"));
    } finally {
      setExporting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <FadeRise>
            <Text style={styles.title}>{t("settings")}</Text>
          </FadeRise>

          <FadeRise delay={80}>
            <Text style={styles.sectionTitle}>{screenText("preferences")}</Text>
            <View style={styles.group}>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={screenText("appLanguage")}
                onPress={() => setLanguageOpen(true)}
                style={styles.row}
              >
                <View style={styles.iconBox}>
                  <Ionicons name="language-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{screenText("appLanguage")}</Text>
                  <Text style={styles.rowValue} numberOfLines={1}>
                    {language.nativeName} · {language.name}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </PressableScale>
            </View>
          </FadeRise>

          <FadeRise delay={160}>
            <Text style={styles.sectionTitle}>{screenText("yourData")}</Text>
            <View style={styles.group}>
              <View style={styles.row}>
                <View style={styles.iconBox}>
                  <Ionicons name="phone-portrait-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{screenText("onDeviceStorage")}</Text>
                  <Text style={styles.rowValue} numberOfLines={1}>
                    {screenText("profileStored")}
                  </Text>
                </View>
                <View style={styles.countChip}>
                  <Text style={styles.countText}>{storageCount}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <PressableScale
                accessibilityRole="button"
                disabled={exporting}
                onPress={exportRecords}
                style={styles.row}
              >
                <View style={styles.iconBox}>
                  <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>
                    {exporting ? screenText("preparingExport") : screenText("exportRecords")}
                  </Text>
                  <Text style={styles.rowValue} numberOfLines={1}>
                    {screenText("exportDescription")}
                  </Text>
                </View>
                <Ionicons name="download-outline" size={19} color={colors.primary} />
              </PressableScale>
            </View>
          </FadeRise>

          <FadeRise delay={240}>
            <View style={styles.privacy}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
              <View style={styles.privacyCopy}>
                <Text style={styles.privacyTitle}>{screenText("privacyMatters")}</Text>
                <Text style={styles.privacyText}>{screenText("privacyDescription")}</Text>
              </View>
            </View>
          </FadeRise>

          <FadeRise delay={320}>
            <View style={styles.about}>
              <View style={styles.brandIcon}>
                <Ionicons name="leaf" size={20} color={colors.white} />
              </View>
              <Text style={styles.aboutTitle}>LumiCare</Text>
              <Text style={styles.version}>{screenText("version")}</Text>
            </View>
          </FadeRise>
        </ScrollView>

        <BottomNav />
      </View>

      <Modal
        visible={languageOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setLanguageOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            accessibilityLabel={t("close")}
            style={StyleSheet.absoluteFill}
            onPress={() => setLanguageOpen(false)}
          />

          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{t("chooseLanguage")}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("close")}
                onPress={() => setLanguageOpen(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.languageList}
              showsVerticalScrollIndicator={false}
            >
              {LANGUAGES.map((item) => {
                const selected = item.code === languageCode;

                return (
                  <Pressable
                    key={item.code}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => void chooseLanguage(item.code)}
                    style={[styles.languageOption, selected && styles.languageSelected]}
                  >
                    <View style={styles.languageCopy}>
                      <Text style={styles.languageNative}>{item.nativeName}</Text>
                      <Text style={styles.languageDetails}>
                        {item.name} · {item.region}
                      </Text>
                    </View>
                    <Ionicons
                      name={selected ? "checkmark-circle" : "ellipse-outline"}
                      size={22}
                      color={selected ? colors.primary : colors.border}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/*
  Type scale shared with the home screen
  title 32/800 · section 19/800 · label 14/700 · body 12/500 · caption 12/500
*/
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1 },
  content: {
    width: "100%",
    maxWidth: MAX_WIDTH,
    alignSelf: "center",
    paddingHorizontal: PAGE_PADDING,
    paddingTop: 20,
    paddingBottom: 32,
  },

  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
    marginBottom: 22,
  },
  sectionTitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 10,
    marginLeft: 4,
  },

  group: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    overflow: "hidden",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 71,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.sageLight,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: { flex: 1, gap: 3 },
  rowTitle: { color: colors.text, fontSize: 14, fontWeight: "700" },
  rowValue: { color: colors.muted, fontSize: 12, fontWeight: "500" },
  countChip: {
    minWidth: 30,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 11,
    backgroundColor: colors.sageLight,
    alignItems: "center",
  },
  countText: { color: colors.primary, fontSize: 12, fontWeight: "800" },

  privacy: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.sageLight,
  },
  privacyCopy: { flex: 1, gap: 4 },
  privacyTitle: { color: colors.text, fontSize: 14, fontWeight: "700" },
  privacyText: { color: colors.muted, fontSize: 12, lineHeight: 18, fontWeight: "500" },

  about: { alignItems: "center", marginTop: 32 },
  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  aboutTitle: { color: colors.text, fontSize: 16, fontWeight: "800", marginTop: 10 },
  version: { color: colors.muted, fontSize: 12, fontWeight: "500", marginTop: 4 },

  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.overlay,
  },
  sheet: {
    width: "100%",
    maxWidth: MAX_WIDTH,
    alignSelf: "center",
    maxHeight: "82%",
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginBottom: 18,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  languageList: { gap: 8, paddingBottom: 10 },
  languageOption: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  languageSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.sageLight,
  },
  languageCopy: { flex: 1, gap: 3 },
  languageNative: { color: colors.text, fontSize: 14, fontWeight: "700" },
  languageDetails: { color: colors.muted, fontSize: 12, fontWeight: "500" },
});