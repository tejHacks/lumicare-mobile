import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BottomNav from "../../components/layout/BottomNav";
import AppButton from "../../components/ui/AppButton";
import colors from "../../constants/colors";
import { getAllScreenings, ScreeningRecord } from "../../db/database";
import { useLanguage } from "../../i18n/LanguageProvider";
import { exportReferralPdf as createReferralPdf } from "../../services/pdf/screeningReport";
import { useAppStore } from "../../stores/appStore";

export default function ReferralsScreen() {
    const { t, screenText } = useLanguage();
    const contact = useAppStore((state) => state.referralContact);
    const setReferralContact = useAppStore((state) => state.setReferralContact);
    const hydrated = useAppStore((state) => state.hydrated);
    const [records, setRecords] = useState<ScreeningRecord[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!hydrated) return;
        let active = true;
        getAllScreenings().then((rows) => {
            if (active) setRecords(rows);
        }).catch(() => { });
        return () => { active = false; };
    }, [hydrated]);

    useFocusEffect(useCallback(() => {
        let active = true;
        getAllScreenings().then((rows) => { if (active) setRecords(rows); }).catch(() => { });
        return () => { active = false; };
    }, []));

    async function saveContact() {
        setSaving(true);
        try {
            setReferralContact(contact);
            Alert.alert("Contact saved", "Referral contact information is stored on this device.");
        } catch {
            Alert.alert("Unable to save", "Please try again.");
        } finally {
            setSaving(false);
        }
    }

    async function exportReferralPdf() {
        try {
            await createReferralPdf(contact);
        } catch (error) {
            Alert.alert("PDF export failed", error instanceof Error ? error.message : "Please try again.");
        }
    }

    async function shareSummary() {
        const message = `LumiCare referral summary\nContact: ${contact.name || "Not provided"}\nPhone: ${contact.phone || "Not provided"}\nFacility: ${contact.facility || "Not provided"}\nSaved screening records: ${records.length}\n\nScreening support only; not a diagnosis.`;
        try { await Share.share({ title: "LumiCare referral summary", message }); }
        catch { Alert.alert("Unable to share", "Please try again."); }
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
            <View style={styles.screen}>
                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                    <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={20} color={colors.primary} /><Text style={styles.backText}>{t("home")}</Text></Pressable>
                    <Text style={styles.eyebrow}>LUMICARE · CARE TEAM</Text>
                    <Text style={styles.title}>{t("referrals")}</Text>
                    <Text style={styles.subtitle}>Save a trusted care contact and prepare a referral summary to share with a mother, health worker, or clinician.</Text>
                    <View style={styles.photoAdvice}>
                        <Ionicons name="eye-outline" size={19} color={colors.primary} />
                        <Text style={styles.photoAdviceText}>{screenText("prepareBabyText")} {screenText("captureEyeText")} {screenText("eyeClear")}</Text>
                    </View>
                    <View style={styles.card}>
                        <Text style={styles.label}>{t("contactName")}</Text>
                        <TextInput value={contact.name} onChangeText={(name) => setReferralContact({ ...contact, name })} placeholder="e.g. Community health worker" style={styles.input} placeholderTextColor="#9AA59B" />
                        <Text style={styles.label}>{t("phone")}</Text>
                        <TextInput value={contact.phone} onChangeText={(phone) => setReferralContact({ ...contact, phone })} placeholder="+234…" keyboardType="phone-pad" style={styles.input} placeholderTextColor="#9AA59B" />
                        <Text style={styles.label}>{t("facility")}</Text>
                        <TextInput value={contact.facility} onChangeText={(facility) => setReferralContact({ ...contact, facility })} placeholder="Clinic or health facility" style={styles.input} placeholderTextColor="#9AA59B" />
                        <AppButton title={saving ? t("loading") : t("save")} onPress={() => void saveContact()} style={styles.action} />
                    </View>
                    <View style={styles.recordsCard}><Ionicons name="folder-open-outline" size={21} color={colors.primary} /><View style={styles.recordsCopy}><Text style={styles.recordsTitle}>{t("records")}</Text><Text style={styles.recordsText}>{records.length} saved record{records.length === 1 ? "" : "s"} can be included in a referral PDF.</Text></View></View>
                    <AppButton title={t("exportPdf")} onPress={() => void exportReferralPdf()} style={styles.action} />
                    <Pressable accessibilityRole="button" onPress={() => void shareSummary()} style={styles.shareButton}><Ionicons name="share-outline" size={18} color={colors.primary} /><Text style={styles.shareText}>Share contact summary</Text></Pressable>
                    <View style={styles.privacy}><Ionicons name="lock-closed-outline" size={17} color={colors.primary} /><Text style={styles.privacyText}>Records stay on this device until you explicitly export or share them. Check the recipient before sending sensitive information.</Text></View>
                </ScrollView>
                <BottomNav />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background }, screen: { flex: 1 }, content: { width: "100%", maxWidth: 600, alignSelf: "center", padding: 22, paddingTop: 16, gap: 13 },
    back: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", paddingVertical: 8 }, backText: { color: colors.primary, fontWeight: "700" }, eyebrow: { color: colors.primary, fontSize: 10, fontWeight: "800", letterSpacing: 1.3 }, title: { color: colors.text, fontSize: 28, fontWeight: "800", marginTop: -7 }, subtitle: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: -6 },
    card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 16, gap: 10 }, label: { color: colors.text, fontSize: 12, fontWeight: "700", marginTop: 4 }, input: { height: 50, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, paddingHorizontal: 13, color: colors.text }, action: { width: "100%", marginTop: 4 },
    photoAdvice: { flexDirection: "row", alignItems: "flex-start", gap: 9, backgroundColor: colors.sageLight, borderRadius: 14, padding: 12 }, photoAdviceText: { flex: 1, color: colors.primaryDark, fontSize: 11, lineHeight: 17 }, recordsCard: { flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: colors.sageLight, padding: 14, borderRadius: 16 }, recordsCopy: { flex: 1, gap: 4 }, recordsTitle: { color: colors.text, fontSize: 13, fontWeight: "800" }, recordsText: { color: colors.muted, fontSize: 11, lineHeight: 16 }, shareButton: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }, shareText: { color: colors.primary, fontSize: 13, fontWeight: "800" }, privacy: { flexDirection: "row", gap: 9, alignItems: "flex-start", padding: 12, backgroundColor: colors.sageLight, borderRadius: 14 }, privacyText: { flex: 1, color: colors.primaryDark, fontSize: 11, lineHeight: 17 },
});
