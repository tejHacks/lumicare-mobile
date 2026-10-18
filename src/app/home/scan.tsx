import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Crypto from "expo-crypto";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import BottomNav from "../../components/layout/BottomNav";
import ScanGuideModal from "../../components/scan/ScanGuideModal";
import AppButton from "../../components/ui/AppButton";
import colors from "../../constants/colors";
import { insertScreening } from "../../db/database";
import { deleteScreeningImage, saveScreeningImage } from "../../db/screeningImages";
import { useLanguage } from "../../i18n/LanguageProvider";
import {
  analyzeEyeImage,
  ScreeningResult,
  ScreeningStatus,
} from "../../services/ml/jaundice_screening";
import { useAppStore } from "../../stores/appStore";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type Stage = "home" | "camera" | "preview" | "analyzing" | "result";

// const STEPS = [
//   { icon: "sunny-outline", title: "prepareBaby", text: "prepareBabyText" },
//   { icon: "eye-outline", title: "captureEye", text: "captureEyeText" },
//   { icon: "scan-outline", title: "tapScan", text: "tapScanText" },
// ] as const;

const RESULT_UI: Record<
  ScreeningStatus,
  { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }
> = {
  clear: { icon: "checkmark-circle", color: "#3F7D4E", bg: "#E6F1E4" },
  possible: { icon: "alert-circle", color: "#C2410C", bg: "#FCEBDD" },
  inconclusive: { icon: "help-circle", color: "#5B6B73", bg: "#E8EDEF" },
};

const RESULT_COPY = {
  clear: { title: "clearResult", text: "clearResultText" },
  possible: { title: "possibleResult", text: "possibleResultText" },
  inconclusive: { title: "unclearResult", text: "unclearResultText" },
} as const;

// ---- Date helpers (local time; avoids toISOString timezone shifts) ----
function stripTime(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function toISODate(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function fromISODate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
    ? date
    : null;
}

function formatDate(d: Date) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function ageLabel(d: Date) {
  const days = Math.floor(
    (stripTime(new Date()).getTime() - d.getTime()) / 86400000,
  );
  if (days < 1) return "Born today";
  if (days === 1) return "1 day old";
  if (days <= 28) return `${days} days old`;
  return `${Math.floor(days / 7)} weeks old`;
}

async function prepareEyeImage(uri: string) {
  const context = ImageManipulator.ImageManipulator.manipulate(uri);
  context.resize({ width: 1200 });
  try {
    const renderedImage = await context.renderAsync();
    try {
      return await renderedImage.saveAsync({
        format: ImageManipulator.SaveFormat.JPEG,
        compress: 0.78,
        base64: false,
      });
    } finally {
      renderedImage.release();
    }
  } finally {
    context.release();
  }
}

function errorDetails(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export default function ScanScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { t, screenText, uploadText } = useLanguage();
  const activeBaby = useAppStore((state) => state.activeBaby);
  const setActiveBaby = useAppStore((state) => state.setActiveBaby);

  const [stage, setStage] = useState<Stage>("home");
  const babyName = activeBaby?.name ?? "";
  const dob = activeBaby?.dateOfBirth ? fromISODate(activeBaby.dateOfBirth) : null;
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const [guideOpen, setGuideOpen] = useState(false);
  const [iosPickerOpen, setIosPickerOpen] = useState(false);
  const [tempDob, setTempDob] = useState(new Date());

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoSaved, setPhotoSaved] = useState(false);
  const [result, setResult] = useState<ScreeningResult | null>(null);

  function updateBabyName(name: string) {
    setActiveBaby({ name, dateOfBirth: activeBaby?.dateOfBirth ?? "" });
  }

  function updateBabyDob(date: Date | null) {
    setActiveBaby({ name: babyName, dateOfBirth: date ? toISODate(date) : "" });
  }

  // Swap in a new photo. Only discards the previous file if it was never
  // saved to history, so a stored screening never loses its image.
  function replacePhoto(path: string) {
    if (photoUri && !photoSaved) deleteScreeningImage(photoUri);
    setPhotoUri(path);
    setPhotoSaved(false);
  }

  // Leave the result screen. The image now belongs to the saved record.
  const clearResult = useCallback(() => {
    setResult(null);
    setPhotoUri(null);
    setPhotoSaved(false);
  }, []);

  // Track keyboard so the pinned button can step aside.
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // Android back button steps back through the flow.
  useEffect(() => {
    if (stage === "home") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (stage === "analyzing") return true;
      if (stage === "result") {
        clearResult();
        setStage("home");
      } else {
        setStage(stage === "preview" ? "camera" : "home");
      }
      return true;
    });
    return () => sub.remove();
  }, [stage, clearResult]);

  function openDatePicker() {
    Keyboard.dismiss();
    const today = stripTime(new Date());
    const initial = dob ?? today;

    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: initial,
        mode: "date",
        maximumDate: today,
        onValueChange: (_, selected) => updateBabyDob(stripTime(selected)),
      });
    } else {
      setTempDob(initial);
      setIosPickerOpen(true);
    }
  }

  // Validate details, then walk the user through the guide before the camera.
  function startScreening() {
    if (!babyName.trim() || !dob) {
      Alert.alert(
        "Baby details needed",
        "Add the baby's name and date of birth to continue.",
      );
      return;
    }
    Keyboard.dismiss();
    setGuideOpen(true);
  }

  function beginCamera() {
    setGuideOpen(false);
    setCameraReady(false);
    setStage("camera");
  }

  async function capture() {
    if (!cameraRef.current || capturing || !cameraReady) return;
    try {
      setCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        const prepared = await prepareEyeImage(photo.uri);
        const localImagePath = await saveScreeningImage(prepared.uri, Crypto.randomUUID());
        replacePhoto(localImagePath);
        setStage("preview");
      }
    } catch (error) {
      console.error("[LumiCare scan] Camera capture failed", error);
      Alert.alert("Couldn't take the photo", errorDetails(error));
    } finally {
      setCapturing(false);
    }
  }

  async function pickEyeImage() {
    try {
      const selection = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.85,
      });

      if (selection.canceled) return;

      const selectedImage = selection.assets[0];
      if (!selectedImage?.uri) {
        Alert.alert("Image unavailable", "Choose another image and try again.");
        return;
      }

      const prepared = await prepareEyeImage(selectedImage.uri);
      const localImagePath = await saveScreeningImage(prepared.uri, Crypto.randomUUID());
      replacePhoto(localImagePath);
      setStage("preview");
    } catch (error) {
      console.error("[LumiCare scan] Gallery image preparation failed", error);
      Alert.alert("Unable to prepare the selected image", errorDetails(error));
    }
  }

  async function runScan() {
    if (!photoUri) return;
    setStage("analyzing");
    try {
      const screeningResult = await analyzeEyeImage(photoUri);
      setResult(screeningResult);
      try {
        await insertScreening({
          babyName: babyName.trim(),
          date: new Date().toISOString(),
          riskScore: screeningResult.status,
          imagePath: photoUri,
          notes: "",
          dateOfBirth: dob ? toISODate(dob) : null,
          // The database keeps its legacy `demo` column; true means this
          // model result is evaluation-only, not that the result was simulated.
          demo: screeningResult.evaluationOnly,
          legacyId: null,
        });
        setPhotoSaved(true);
      } catch (error) {
        console.error("[LumiCare scan] Saving screening record failed", error);
        deleteScreeningImage(photoUri);
        setPhotoUri(null);
        setPhotoSaved(false);
        Alert.alert("Result could not be saved", errorDetails(error));
      }
      setStage("result");
    } catch (error) {
      console.error("[LumiCare scan] Model analysis failed", error);
      Alert.alert(
        "On-device model unavailable",
        `The photo could not be analyzed. Expo Go does not include ONNX Runtime; install and open a LumiCare development build to run the model.\n\n${errorDetails(error)}`,
      );
      setStage("preview");
    }
  }

  // ======================= CAMERA =======================
  if (stage === "camera") {
    const guideW = Math.min(width - 64, 360);
    const guideH = guideW * 0.55;

    return (
      <View style={styles.cameraRoot}>
        <StatusBar barStyle="light-content" />

        {permission?.granted ? (
          <>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing={facing}
              onCameraReady={() => setCameraReady(true)}
            />

            <View style={[styles.cameraTop, { paddingTop: insets.top + 10 }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close camera"
                onPress={() => setStage("home")}
                style={styles.roundButton}
              >
                <Ionicons name="close" size={22} color="#FFFFFF" />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Switch camera"
                onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
                style={styles.roundButton}
              >
                <Ionicons name="camera-reverse-outline" size={22} color="#FFFFFF" />
              </Pressable>
            </View>

            <View pointerEvents="none" style={styles.guideWrap}>
              <View
                style={[
                  styles.guide,
                  { width: guideW, height: guideH, borderRadius: guideH / 2 },
                ]}
              />
              <Text style={styles.guideText}>{screenText("captureEye")}</Text>
              <Text style={[styles.guideText, styles.guideHint]}>
                {screenText("prepareBabyText")}
              </Text>
            </View>

            <View style={[styles.cameraBottom, { paddingBottom: insets.bottom + 28 }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={uploadText()}
                onPress={() => void pickEyeImage()}
                style={styles.galleryButton}
              >
                <Ionicons name="images-outline" size={23} color="#FFFFFF" />
                <Text style={styles.galleryButtonText}>{uploadText()}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Capture"
                onPress={() => void capture()}
                disabled={!cameraReady || capturing}
                style={[styles.shutterOuter, (!cameraReady || capturing) && styles.dimmed]}
              >
                <View style={styles.shutterInner} />
              </Pressable>
              <View style={styles.galleryButtonSpacer} />
            </View>
          </>
        ) : (
          <View style={styles.permissionBox}>
            <Ionicons name="camera-outline" size={42} color="#FFFFFF" />
            <Text style={styles.permissionTitle}>{screenText("cameraNeeded")}</Text>
            <Text style={styles.permissionText}>{screenText("cameraText")}</Text>
            <AppButton
              title={
                permission && !permission.canAskAgain
                  ? screenText("openSettings")
                  : screenText("allowCamera")
              }
              onPress={() =>
                permission && !permission.canAskAgain
                  ? Linking.openSettings()
                  : requestPermission()
              }
              style={styles.permissionButton}
            />
            <Pressable onPress={() => setStage("home")} style={styles.textButton}>
              <Text style={styles.permissionCancel}>{screenText("notNow")}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => void pickEyeImage()}
              style={styles.permissionUploadButton}
            >
              <Ionicons name="images-outline" size={19} color="#FFFFFF" />
              <Text style={styles.permissionCancel}>{uploadText()}</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  // =================== PREVIEW / ANALYZING ===================
  if (stage === "preview" || stage === "analyzing") {
    const analyzing = stage === "analyzing";

    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.flowPage}>
          <Text style={styles.flowTitle}>{screenText("checkPhoto")}</Text>
          <Text style={styles.flowSub}>{screenText("eyeClear")}</Text>

          <View style={styles.previewWrap}>
            {photoUri && (
              <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
            )}
            {analyzing && (
              <View style={styles.analyzingOverlay}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.analyzingText}>{t("loading")}</Text>
              </View>
            )}
          </View>

          <View style={styles.photoQualityNote}>
            <Ionicons name="sunny-outline" size={18} color={colors.primary} />
            <Text style={styles.photoQualityText}>
              {screenText("prepareBabyText")} {screenText("captureEyeText")}
            </Text>
          </View>

          <View style={styles.flowActions}>
            <AppButton
              title={analyzing ? t("loading") : t("startScreening")}
              onPress={() => void runScan()}
            />
            <Pressable
              accessibilityRole="button"
              disabled={analyzing}
              onPress={() => setStage("camera")}
              style={[styles.secondaryButton, analyzing && styles.dimmedStrong]}
            >
              <Ionicons name="refresh" size={18} color={colors.primary} />
              <Text style={styles.secondaryText}>{screenText("retake")}</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ======================= RESULT =======================
  if (stage === "result" && result) {
    const ui = RESULT_UI[result.status];
    const copy = RESULT_COPY[result.status];

    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.flowPage} showsVerticalScrollIndicator={false}>


          <View style={styles.resultCard}>
            {photoUri && <Image source={{ uri: photoUri }} style={styles.resultThumb} />}
            <View style={[styles.resultIcon, { backgroundColor: ui.bg }]}>
              <Ionicons name={ui.icon} size={32} color={ui.color} />
            </View>
            <Text style={styles.resultTitle}>{screenText(copy.title)}</Text>
            <Text style={styles.resultText}>{screenText(copy.text)}</Text>

            <View style={[styles.savedChip, !photoSaved && styles.savedChipWarn]}>
              <Ionicons
                name={photoSaved ? "shield-checkmark-outline" : "alert-circle-outline"}
                size={14}
                color={photoSaved ? "#3F7D4E" : "#C2410C"}
              />
              <Text style={[styles.savedChipText, !photoSaved && styles.savedChipTextWarn]}>
                {photoSaved ? "Saved on this device" : "Not saved on this device"}
              </Text>
            </View>

            <Text style={styles.resultNote}>{screenText("screeningNote")}</Text>
          </View>

          <View style={styles.flowActions}>
            <AppButton
              title={screenText("scanAgain")}
              onPress={() => {
                clearResult();
                setStage("camera");
              }}
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                clearResult();
                setStage("home");
              }}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryText}>{screenText("done")}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ======================= HOME =======================
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.screen}>
        <KeyboardAvoidingView style={styles.screen} behavior="padding">
          <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>{t("scan")}</Text>
            <Text style={styles.subtitle}>{screenText("scanSubtitle")}</Text>

            <View style={styles.card}>
              <Text style={styles.label}>{t("babyName")}</Text>
              <TextInput
                accessibilityLabel="Baby's name"
                value={babyName}
                onChangeText={updateBabyName}
                placeholder={screenText("babyPlaceholder")}
                placeholderTextColor="#9AA59B"
                style={styles.input}
                autoCapitalize="words"
                returnKeyType="done"
                maxLength={80}
              />

              <Text style={[styles.label, styles.secondLabel]}>{t("dateOfBirth")}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Choose date of birth"
                onPress={openDatePicker}
                style={styles.dateField}
              >
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                <Text style={[styles.dateText, !dob && styles.datePlaceholder]}>
                  {dob ? formatDate(dob) : screenText("selectDate")}
                </Text>
                {dob && <Text style={styles.ageChip}>{ageLabel(dob)}</Text>}
              </Pressable>
            </View>


          </ScrollView>

          {!keyboardVisible && (
            <View style={styles.footer}>
              <AppButton title={t("startScreening")} onPress={startScreening} />
            </View>
          )}
        </KeyboardAvoidingView>

        <BottomNav />
      </View>

      <ScanGuideModal
        visible={guideOpen}
        onClose={() => setGuideOpen(false)}
        onStart={beginCamera}
      />

      {Platform.OS === "ios" && (
        <Modal
          visible={iosPickerOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setIosPickerOpen(false)}
        >
          <View style={styles.modalBackdrop}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setIosPickerOpen(false)} />
            <View style={[styles.pickerSheet, { paddingBottom: insets.bottom + 16 }]}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>{t("dateOfBirth")}</Text>
                <Pressable
                  onPress={() => {
                    updateBabyDob(stripTime(tempDob));
                    setIosPickerOpen(false);
                  }}
                >
                  <Text style={styles.pickerDone}>{screenText("done")}</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={tempDob}
                mode="date"
                display="spinner"
                themeVariant="light"
                maximumDate={stripTime(new Date())}
                onValueChange={(_, selected) => setTempDob(selected)}
              />
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1 },
  dimmed: { opacity: 0.5 },
  dimmedStrong: { opacity: 0.4 },
  content: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
  },
  title: { color: colors.text, fontSize: 24, fontWeight: "800", letterSpacing: -0.6 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 4, marginBottom: 16 },

  card: {
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 22,
  },
  label: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  secondLabel: { marginTop: 14 },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 15,
  },
  dateField: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
  },
  dateText: { flex: 1, color: colors.text, fontSize: 15 },
  datePlaceholder: { color: "#9AA59B" },
  ageChip: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
    backgroundColor: colors.sageLight,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: "hidden",
  },

  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: "800", marginBottom: 12 },
  steps: { gap: 0 },
  stepRow: { flexDirection: "row", gap: 14 },
  stepRail: { alignItems: "center" },
  stepIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.sageLight,
    alignItems: "center",
    justifyContent: "center",
  },
  stepLine: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 4 },
  stepCopy: { flex: 1, paddingBottom: 16, gap: 3 },
  stepTitle: { color: colors.text, fontSize: 14, fontWeight: "800" },
  stepText: { color: colors.muted, fontSize: 12.5, lineHeight: 19 },

  footer: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },

  // Camera
  cameraRoot: { flex: 1, backgroundColor: "#000000" },
  cameraTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
  },
  roundButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  guideWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  guide: { borderWidth: 2, borderColor: "rgba(255,255,255,0.95)" },
  guideText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 16,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowRadius: 4,
  },
  guideHint: {
    maxWidth: 320,
    marginTop: 8,
    paddingHorizontal: 12,
    textAlign: "center",
    fontSize: 11,
    lineHeight: 16,
  },
  cameraBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingHorizontal: 24,
  },
  galleryButton: {
    width: 88,
    minHeight: 64,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  galleryButtonText: {
    maxWidth: 88,
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  galleryButtonSpacer: { width: 88, minHeight: 64 },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#FFFFFF" },
  permissionBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  permissionTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "800" },
  permissionText: { color: "#C8D0C6", fontSize: 14, textAlign: "center", lineHeight: 21 },
  permissionButton: { width: "100%", marginTop: 10 },
  permissionUploadButton: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  textButton: { padding: 12 },
  permissionCancel: { color: "#C8D0C6", fontSize: 14, fontWeight: "600" },

  // Preview / result
  flowPage: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  flowTitle: { color: colors.text, fontSize: 24, fontWeight: "800", letterSpacing: -0.6 },
  flowSub: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 4, marginBottom: 16 },
  previewWrap: {
    flex: 1,
    minHeight: 220,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#0F1F17",
  },
  photoQualityNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: colors.sageLight,
  },
  photoQualityText: { flex: 1, color: colors.primaryDark, fontSize: 12, lineHeight: 18 },
  preview: { width: "100%", height: "100%" },
  analyzingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(15,31,23,0.62)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  analyzingText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  flowActions: { gap: 10, marginTop: 16 },
  secondaryButton: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  secondaryText: { color: colors.primary, fontSize: 15, fontWeight: "700" },

  resultCard: {
    alignItems: "center",
    padding: 20,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultThumb: { width: 96, height: 96, borderRadius: 20, marginBottom: -20, zIndex: 0 },
  resultIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: colors.surface,
    zIndex: 1,
  },
  resultTitle: { color: colors.text, fontSize: 20, fontWeight: "800", marginTop: 12, textAlign: "center" },
  resultText: { color: colors.muted, fontSize: 13.5, lineHeight: 21, marginTop: 6, textAlign: "center" },
  savedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "#E6F1E4",
  },
  savedChipWarn: { backgroundColor: "#FCEBDD" },
  savedChipText: { color: "#3F7D4E", fontSize: 11.5, fontWeight: "700" },
  savedChipTextWarn: { color: "#C2410C" },
  resultNote: { color: "#8A968A", fontSize: 11.5, marginTop: 12, textAlign: "center" },

  // iOS date sheet
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(15,31,23,0.42)" },
  pickerSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  pickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pickerTitle: { color: colors.text, fontSize: 17, fontWeight: "800" },
  pickerDone: { color: colors.primary, fontSize: 16, fontWeight: "800" },
});