import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BottomNav from "../../components/layout/BottomNav";
import colors from "../../constants/colors";
import { useLanguage } from "../../i18n/LanguageProvider";

const topics = [
    { icon: "eye-outline" as const, title: "What to look for", text: "Yellowing of the skin or whites of the eyes can be a sign of jaundice. It may be harder to notice on darker skin; check the whites of the eyes and seek professional advice if concerned." },
    { icon: "time-outline" as const, title: "When to seek help", text: "Contact a qualified health worker promptly if you notice yellowing, especially in the first 24 hours, or if the baby is feeding poorly or unusually sleepy." },
    { icon: "water-outline" as const, title: "Support feeding", text: "Follow your clinician’s feeding advice. Ask a health worker for help if feeding is difficult; do not use sunlight or home remedies as treatment." },
    { icon: "medkit-outline" as const, title: "Professional assessment", text: "Only a qualified clinician can assess jaundice and decide whether bilirubin testing or treatment is needed. An app image result is not a diagnosis." },
];

export default function GuideScreen() {
    const { t } = useLanguage();
    return (
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
            <View style={styles.screen}>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
                        <Ionicons name="arrow-back" size={20} color={colors.primary} /><Text style={styles.backText}>{t("home")}</Text>
                    </Pressable>
                    <Text style={styles.eyebrow}>LUMICARE · LEARN</Text>
                    <Text style={styles.title}>{t("guide")}</Text>
                    <Text style={styles.subtitle}>Practical information to help families recognise concerns and seek qualified care.</Text>
                    <View style={styles.alertCard}><Ionicons name="warning-outline" size={23} color="#A54612" /><View style={styles.alertCopy}><Text style={styles.alertTitle}>Get urgent help for danger signs</Text><Text style={styles.alertText}>Difficulty breathing, seizures, inability to feed, extreme sleepiness, or yellowing in the first 24 hours needs urgent professional assessment. Do not wait for an app check.</Text></View></View>
                    {topics.map((topic, index) => (
                        <View key={topic.title} style={styles.topicCard}>
                            <View style={styles.icon}><Ionicons name={topic.icon} size={22} color={colors.primary} /></View>
                            <View style={styles.topicCopy}><Text style={styles.topicTitle}>{index + 1}. {topic.title}</Text><Text style={styles.topicText}>{topic.text}</Text></View>
                        </View>
                    ))}
                    <View style={styles.disclaimer}><Ionicons name="shield-checkmark-outline" size={19} color={colors.primary} /><Text style={styles.disclaimerText}>{t("disclaimer")}</Text></View>
                </ScrollView>
                <BottomNav />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background }, screen: { flex: 1 },
    content: { width: "100%", maxWidth: 600, alignSelf: "center", padding: 22, paddingTop: 16, gap: 14 },
    back: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", paddingVertical: 8 }, backText: { color: colors.primary, fontWeight: "700" },
    eyebrow: { color: colors.primary, fontSize: 10, fontWeight: "800", letterSpacing: 1.3 }, title: { color: colors.text, fontSize: 28, fontWeight: "800", marginTop: -8 }, subtitle: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: -7, marginBottom: 4 },
    alertCard: { flexDirection: "row", gap: 11, backgroundColor: "#FFF0E1", borderRadius: 17, padding: 15 }, alertCopy: { flex: 1, gap: 5 }, alertTitle: { color: "#85370D", fontSize: 14, fontWeight: "800" }, alertText: { color: "#67442E", fontSize: 12, lineHeight: 18 },
    topicCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 17, padding: 15 }, icon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.sageLight, alignItems: "center", justifyContent: "center" }, topicCopy: { flex: 1, gap: 6 }, topicTitle: { color: colors.text, fontSize: 14, fontWeight: "800" }, topicText: { color: colors.muted, fontSize: 12, lineHeight: 19 },
    disclaimer: { flexDirection: "row", gap: 8, alignItems: "flex-start", backgroundColor: colors.sageLight, padding: 13, borderRadius: 14, marginTop: 4 }, disclaimerText: { flex: 1, color: colors.primaryDark, fontSize: 11, lineHeight: 17 },
});
