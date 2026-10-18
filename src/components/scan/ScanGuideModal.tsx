import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

import colors from "../../constants/colors";
import AppButton from "../ui/AppButton";

type Props = {
  visible: boolean;
  onClose: () => void;
  onStart: () => void;
};

const SKIN = "#E9B896";
const SKIN_DARK = "#D79F7A";
const SCLERA = "#FFFFFF";
const IRIS = "#6B4A2F";
const GREEN = "#3F7D4E";
const AMBER = "#F2B544";
const RED = "#C2410C";

// ---------- Illustrations (viewBox 240 x 170) ----------

function LightArt() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 240 170">
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFF4CC" />
          <Stop offset="1" stopColor="#E6F1E4" />
        </LinearGradient>
      </Defs>
      <Rect width="240" height="170" fill="url(#sky)" />
      {/* sun */}
      <G>
        <Circle cx="48" cy="42" r="18" fill={AMBER} />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
          const r = (a * Math.PI) / 180;
          return (
            <Line
              key={a}
              x1={48 + Math.cos(r) * 25}
              y1={42 + Math.sin(r) * 25}
              x2={48 + Math.cos(r) * 33}
              y2={42 + Math.sin(r) * 33}
              stroke={AMBER}
              strokeWidth="3"
              strokeLinecap="round"
            />
          );
        })}
      </G>
      {/* baby face */}
      <Circle cx="140" cy="98" r="48" fill={SKIN} />
      <Ellipse cx="100" cy="106" rx="8" ry="5" fill="#F2A5A0" opacity="0.55" />
      <Ellipse cx="180" cy="106" rx="8" ry="5" fill="#F2A5A0" opacity="0.55" />
      <Path d="M126 128 Q140 138 154 128" stroke={SKIN_DARK} strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* eyes open */}
      {[122, 158].map((x) => (
        <G key={x}>
          <Ellipse cx={x} cy="92" rx="10" ry="7" fill={SCLERA} />
          <Circle cx={x} cy="92" r="4.5" fill={IRIS} />
          <Circle cx={x + 1.5} cy="90.5" r="1.3" fill="#FFFFFF" />
        </G>
      ))}
      {/* hair tuft */}
      <Path d="M132 52 Q140 40 148 52" stroke={SKIN_DARK} strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* no flash badge */}
      <G>
        <Circle cx="204" cy="40" r="18" fill="#FFFFFF" stroke={RED} strokeWidth="3" />
        <Path d="M206 29 L198 42 H205 L202 51 L211 37 H204 Z" fill={AMBER} />
        <Line x1="192" y1="52" x2="216" y2="28" stroke={RED} strokeWidth="3" strokeLinecap="round" />
      </G>
    </Svg>
  );
}

function EyeArt() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 240 170">
      <Rect width="240" height="170" fill="#F3F6F1" />
      <Ellipse cx="120" cy="85" rx="104" ry="68" fill={SKIN} />
      {/* eyelid shadow */}
      <Path d="M40 85 Q120 14 200 85" fill={SKIN_DARK} opacity="0.5" />
      {/* eye */}
      <Path d="M44 85 Q120 22 196 85 Q120 148 44 85 Z" fill={SCLERA} />
      <Circle cx="120" cy="85" r="26" fill={IRIS} />
      <Circle cx="120" cy="85" r="11" fill="#1B1B1B" />
      <Circle cx="130" cy="75" r="4.5" fill="#FFFFFF" opacity="0.9" />
      {/* sclera highlight zones */}
      <Path
        d="M52 85 Q70 66 90 62 Q80 85 90 108 Q70 104 52 85 Z"
        fill="none"
        stroke={GREEN}
        strokeWidth="2.5"
        strokeDasharray="5 4"
      />
      <Path
        d="M188 85 Q170 66 150 62 Q160 85 150 108 Q170 104 188 85 Z"
        fill="none"
        stroke={GREEN}
        strokeWidth="2.5"
        strokeDasharray="5 4"
      />
      {/* callout */}
      <G>
        <Rect x="68" y="136" width="104" height="22" rx="11" fill={GREEN} />
        <Circle cx="82" cy="147" r="4" fill="#FFFFFF" />
        <Rect x="92" y="144" width="68" height="6" rx="3" fill="#FFFFFF" opacity="0.9" />
      </G>
    </Svg>
  );
}

function CaptureArt() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 240 170">
      <Rect width="240" height="170" fill="#E8EDEF" />
      {/* phone */}
      <Rect x="70" y="8" width="100" height="154" rx="16" fill="#1B2A22" />
      <Rect x="76" y="18" width="88" height="134" rx="8" fill="#0F1F17" />
      {/* viewfinder oval */}
      <Ellipse cx="120" cy="78" rx="34" ry="19" fill="none" stroke="#FFFFFF" strokeWidth="2" />
      {/* eye inside */}
      <Path d="M94 78 Q120 56 146 78 Q120 100 94 78 Z" fill={SCLERA} />
      <Circle cx="120" cy="78" r="9" fill={IRIS} />
      <Circle cx="120" cy="78" r="4" fill="#1B1B1B" />
      {/* corner marks */}
      {[
        "M82 30 V24 H88",
        "M158 30 V24 H152",
        "M82 126 V132 H88",
        "M158 126 V132 H152",
      ].map((d) => (
        <Path key={d} d={d} stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" />
      ))}
      {/* shutter */}
      <Circle cx="120" cy="140" r="9" fill="none" stroke="#FFFFFF" strokeWidth="2" />
      <Circle cx="120" cy="140" r="6" fill="#FFFFFF" />
      {/* distance arrows */}
      <G stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" fill="none">
        <Path d="M30 78 H56" />
        <Path d="M48 70 L56 78 L48 86" />
        <Path d="M210 78 H184" />
        <Path d="M192 70 L184 78 L192 86" />
      </G>
    </Svg>
  );
}

function ResultArt() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 240 170">
      <Rect width="240" height="170" fill="#E6F1E4" />
      {/* photo thumb */}
      <Rect x="30" y="34" width="72" height="72" rx="14" fill={SKIN} />
      <Path d="M44 70 Q66 52 88 70 Q66 88 44 70 Z" fill={SCLERA} />
      <Circle cx="66" cy="70" r="8" fill={IRIS} />
      <Circle cx="66" cy="70" r="3.5" fill="#1B1B1B" />
      {/* arrow */}
      <G stroke={GREEN} strokeWidth="3" strokeLinecap="round" fill="none">
        <Path d="M112 70 H132" />
        <Path d="M125 62 L133 70 L125 78" />
      </G>
      {/* result card */}
      <Rect x="140" y="26" width="76" height="88" rx="14" fill="#FFFFFF" />
      <Circle cx="178" cy="56" r="17" fill="#E6F1E4" />
      <Path d="M169 56 L176 63 L188 49" stroke={GREEN} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="154" y="82" width="48" height="6" rx="3" fill="#D5DDD6" />
      <Rect x="160" y="94" width="36" height="6" rx="3" fill="#E6EBE7" />
      {/* tags */}
      <Rect x="40" y="124" width="160" height="26" rx="13" fill="#FFFFFF" />
      <Circle cx="58" cy="137" r="5" fill={GREEN} />
      <Circle cx="120" cy="137" r="5" fill={AMBER} />
      <Circle cx="168" cy="137" r="5" fill="#9AA59B" />
      <Rect x="68" y="134" width="36" height="6" rx="3" fill="#D5DDD6" />
      <Rect x="130" y="134" width="24" height="6" rx="3" fill="#D5DDD6" />
      <Rect x="178" y="134" width="14" height="6" rx="3" fill="#D5DDD6" />
    </Svg>
  );
}

// ---------- Slides ----------

type Slide = {
  title: string;
  text: string;
  tips: { icon: keyof typeof Ionicons.glyphMap; label: string }[];
  Art: () => React.JSX.Element;
};

const SLIDES: Slide[] = [
  {
    title: "Prepare the baby",
    text: "Find bright, even daylight, near a window or outdoors in the shade. Keep the baby calm and facing you.",
    tips: [
      { icon: "sunny-outline", label: "Daylight" },
      { icon: "flash-off-outline", label: "No flash" },
      { icon: "happy-outline", label: "Baby calm" },
    ],
    Art: LightArt,
  },
  {
    title: "Find the white of the eye",
    text: "Gently open the eyelid so the white of the eye shows. If one eye looks yellower, use that one.",
    tips: [
      { icon: "eye-outline", label: "Eye open" },
      { icon: "scan-outline", label: "White visible" },
      { icon: "hand-left-outline", label: "Be gentle" },
    ],
    Art: EyeArt,
  },
  {
    title: "Capture the eye",
    text: "Hold the phone about 10 to 15 cm away and fit the eye inside the oval. Hold steady, then tap the shutter.",
    tips: [
      { icon: "resize-outline", label: "10–15 cm" },
      { icon: "ellipse-outline", label: "Eye in oval" },
      { icon: "images-outline", label: "Or upload" },
    ],
    Art: CaptureArt,
  },
  {
    title: "Check, then scan",
    text: "Make sure the photo is sharp and well lit, then tap scan. Your result appears in a few seconds.",
    tips: [
      { icon: "checkmark-circle-outline", label: "Sharp photo" },
      { icon: "refresh", label: "Retake if blurry" },
      { icon: "shield-checkmark-outline", label: "Saved on phone" },
    ],
    Art: ResultArt,
  },
];

export default function ScanGuideModal({ visible, onClose, onStart }: Props) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (visible) setIndex(0);
  }, [visible]);

  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;
  const Art = slide.Art;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.grabber} />

          <View style={styles.header}>
            <View style={styles.stepPill}>
              <Text style={styles.stepPillText}>
                Step {index + 1} of {SLIDES.length}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close guide"
              hitSlop={10}
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={18} color={colors.muted} />
            </Pressable>
          </View>

          <View style={styles.art}>
            <Art />
          </View>

          <View style={styles.copy}>
            <Text style={styles.title}>
              {index + 1}. {slide.title}
            </Text>
            <Text style={styles.text}>{slide.text}</Text>
          </View>

          <View style={styles.tips}>
            {slide.tips.map((tip) => (
              <View key={tip.label} style={styles.tip}>
                <Ionicons name={tip.icon} size={14} color={colors.primary} />
                <Text style={styles.tipText}>{tip.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>

          <View style={styles.actions}>
            {index > 0 && (
              <Pressable
                accessibilityRole="button"
                onPress={() => setIndex((i) => i - 1)}
                style={styles.backButton}
              >
                <Ionicons name="chevron-back" size={20} color={colors.primary} />
              </Pressable>
            )}
            <View style={styles.primary}>
              {isLast ? (
                <AppButton title="Start screening" onPress={onStart} />
              ) : (
                <AppButton title="Next" onPress={() => setIndex((i) => i + 1)} />
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15,31,23,0.5)",
  },
  sheet: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  grabber: {
    alignSelf: "center",
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  stepPill: {
    backgroundColor: colors.sageLight,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 12,
  },
  stepPillText: { color: colors.primary, fontSize: 11.5, fontWeight: "800" },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  art: {
    height: 180,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  copy: { marginTop: 16, gap: 6 },
  title: { color: colors.text, fontSize: 20, fontWeight: "800", letterSpacing: -0.4 },
  text: { color: colors.muted, fontSize: 13.5, lineHeight: 20 },
  tips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  tip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipText: { color: colors.text, fontSize: 11.5, fontWeight: "700" },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 18 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { width: 20, backgroundColor: colors.primary },
  actions: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 16 },
  backButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  primary: { flex: 1 },
});