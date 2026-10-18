import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BottomNav from "../../components/layout/BottomNav";
import colors from "../../constants/colors";
import { deleteScreening, getAllScreenings, ScreeningRecord } from "../../db/database";
import { useLanguage } from "../../i18n/LanguageProvider";
import { exportScreeningsPdf } from "../../services/pdf/screeningReport";

type RecordItem = ScreeningRecord;

const statusLabels: Record<string, string> = {
    clear: "No yellowing detected",
    possible: "Possible jaundice",
    inconclusive: "Image not clear enough",
};

export default function RecordsScreen() {
    const { t } = useLanguage();
    const [records, setRecords] = useState<RecordItem[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [exporting, setExporting] = useState(false);
    const [viewingRecord, setViewingRecord] = useState<RecordItem | null>(null);
    const [viewingImageUri, setViewingImageUri] = useState<string | null>(null);

    const loadRecords = useCallback(async () => {
        try {
            const rows = await getAllScreenings();
            setRecords(rows);
            setSelectedIds((current) => current.filter((id) => rows.some((record) => record.id === id)));
        } catch {
            Alert.alert("Unable to load records", "Please try again.");
        }
    }, []);

    useFocusEffect(useCallback(() => { void loadRecords(); }, [loadRecords]));

    async function exportPdf() {
        if (!selectedIds.length || exporting) return;

        setExporting(true);
        try {
            await exportScreeningsPdf(selectedIds);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Could not create the PDF. Please try again.";
            Alert.alert("PDF export failed", message);
        } finally {
            setExporting(false);
        }
    }

    function toggleRecord(recordId: number) {
        setSelectedIds((current) => current.includes(recordId)
            ? current.filter((id) => id !== recordId)
            : [...current, recordId]);
    }

    async function deleteRecord(record: RecordItem) {
        try {
            await deleteScreening(record.id);
            setRecords((current) => current.filter((item) => item.id !== record.id));
            setSelectedIds((current) => current.filter((id) => id !== record.id));
            setViewingRecord((current) => current?.id === record.id ? null : current);
            setViewingImageUri(null);
        } catch {
            Alert.alert("Unable to delete record", "Please try again.");
        }
    }

    function confirmDelete(record: RecordItem) {
        Alert.alert(
            "Delete screening record?",
            `This removes ${record.babyName || "the baby's"} record and saved image from this device.`,
            [
                { text: t("cancel"), style: "cancel" },
                { text: t("delete"), style: "destructive", onPress: () => void deleteRecord(record) },
            ],
        );
    }

    function viewRecord(record: RecordItem) {
        setViewingRecord(record);
        setViewingImageUri(record.imagePath);
    }

    function toggleAllRecords() {
        setSelectedIds((current) => current.length === records.length
            ? []
            : records.map((record) => record.id));
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
            <View style={styles.screen}>
                <ScrollView contentContainerStyle={styles.content}>
                    <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
                        <Ionicons name="arrow-back" size={20} color={colors.primary} />
                        <Text style={styles.backText}>{t("home")}</Text>
                    </Pressable>
                    <View style={styles.headingRow}>
                        <View style={styles.headingCopy}>
                            <Text style={styles.eyebrow}>LUMICARE</Text>
                            <Text style={styles.title}>{t("records")}</Text>
                        </View>
                        <Pressable accessibilityRole="button" accessibilityLabel={t("exportPdf")} disabled={!selectedIds.length || exporting} onPress={() => void exportPdf()} style={[styles.exportButton, (!selectedIds.length || exporting) && styles.disabled]}>
                            <Ionicons name="document-text-outline" size={19} color={colors.white} />
                            <Text style={styles.exportText}>{exporting ? t("loading") : `${t("exportPdf")} (${selectedIds.length})`}</Text>
                        </Pressable>
                    </View>
                    {records.length > 0 && (
                        <View style={styles.selectionRow}>
                            <Text style={styles.selectionHint}>Tap records to select the results and eye photos for export.</Text>
                            <Pressable accessibilityRole="button" onPress={toggleAllRecords}>
                                <Text style={styles.selectAllText}>{selectedIds.length === records.length ? "Clear" : "Select all"}</Text>
                            </Pressable>
                        </View>
                    )}
                    {records.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <View style={styles.emptyIcon}><Ionicons name="folder-open-outline" size={28} color={colors.primary} /></View>
                            <Text style={styles.emptyTitle}>{t("noRecords")}</Text>
                            <Text style={styles.emptyText}>Completed screening summaries will be saved on this device and shown here.</Text>
                            <Pressable accessibilityRole="button" onPress={() => router.push("/home/scan")} style={styles.primaryButton}>
                                <Text style={styles.primaryText}>{t("startScreening")}</Text>
                            </Pressable>
                        </View>
                    ) : records.map((record) => {
                        const selected = selectedIds.includes(record.id);
                        const thumbnailUri = record.imagePath ?? undefined;
                        return (
                            <View key={record.id} style={[styles.recordCard, selected && styles.recordSelected]}>
                                <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={() => toggleRecord(record.id)} style={styles.recordSelectRow}>
                                    {thumbnailUri
                                        ? <Image source={{ uri: thumbnailUri }} style={styles.recordThumbnail} />
                                        : <View style={styles.recordIcon}><Ionicons name="heart-outline" size={21} color={colors.primary} /></View>}
                                    <View style={styles.recordCopy}>
                                        <Text style={styles.recordName}>{record.babyName}</Text>
                                        <Text style={styles.recordStatus}>{statusLabels[record.riskScore] ?? record.riskScore}</Text>
                                        <Text style={styles.recordDate}>{new Date(record.date).toLocaleString()}</Text>
                                        {record.demo && <Text style={styles.demoTag}>ENGINEERING EVALUATION · NOT CLINICAL</Text>}
                                    </View>
                                    <Ionicons name={selected ? "checkmark-circle" : "ellipse-outline"} size={23} color={selected ? colors.primary : "#B9C4BA"} />
                                </Pressable>
                                <View style={styles.recordActions}>
                                    <Pressable accessibilityRole="button" onPress={() => void viewRecord(record)} style={styles.recordActionButton}>
                                        <Ionicons name="eye-outline" size={17} color={colors.primary} />
                                        <Text style={styles.recordActionText}>View</Text>
                                    </Pressable>
                                    <Pressable accessibilityRole="button" onPress={() => confirmDelete(record)} style={[styles.recordActionButton, styles.deleteAction]}>
                                        <Ionicons name="trash-outline" size={17} color={colors.danger} />
                                        <Text style={[styles.recordActionText, styles.deleteText]}>{t("delete")}</Text>
                                    </Pressable>
                                </View>
                            </View>);
                    })}
                    <View style={styles.disclaimer}><Ionicons name="information-circle-outline" size={18} color={colors.primary} /><Text style={styles.disclaimerText}>{t("disclaimer")}</Text></View>
                </ScrollView>
                <BottomNav />
            </View>
            <Modal visible={viewingRecord !== null} transparent animationType="slide" onRequestClose={() => setViewingRecord(null)}>
                <View style={styles.detailBackdrop}>
                    <Pressable accessibilityLabel="Close record details" style={StyleSheet.absoluteFill} onPress={() => { setViewingRecord(null); setViewingImageUri(null); }} />
                    {viewingRecord && (
                        <ScrollView contentContainerStyle={styles.detailSheet}>
                            <View style={styles.detailHeader}>
                                <Text style={styles.detailTitle}>Screening result</Text>
                                <Pressable accessibilityRole="button" accessibilityLabel={t("close")} onPress={() => { setViewingRecord(null); setViewingImageUri(null); }} style={styles.closeButton}>
                                    <Ionicons name="close" size={21} color={colors.text} />
                                </Pressable>
                            </View>
                            <Text style={styles.detailName}>{viewingRecord.babyName || "Baby"}</Text>
                            {viewingRecord.dateOfBirth ? <Text style={styles.detailMeta}>Date of birth: {viewingRecord.dateOfBirth}</Text> : null}
                            <Text style={styles.detailMeta}>Screened: {new Date(viewingRecord.date).toLocaleString()}</Text>
                            <Text style={styles.detailResult}>{statusLabels[viewingRecord.riskScore] ?? viewingRecord.riskScore}</Text>
                            {viewingRecord.demo ? <Text style={styles.detailDemo}>ENGINEERING EVALUATION ONLY — NOT A CLINICAL RESULT</Text> : null}
                            {viewingImageUri
                                ? <Image source={{ uri: viewingImageUri }} style={styles.detailImage} resizeMode="contain" />
                                : <View style={styles.noImage}><Ionicons name="image-outline" size={26} color={colors.muted} /><Text style={styles.noImageText}>No image is available for this record.</Text></View>}
                            <Text style={styles.detailDisclaimer}>{t("disclaimer")}</Text>
                            <Pressable accessibilityRole="button" onPress={() => confirmDelete(viewingRecord)} style={[styles.recordActionButton, styles.detailDelete]}>
                                <Ionicons name="trash-outline" size={18} color={colors.danger} />
                                <Text style={[styles.recordActionText, styles.deleteText]}>Delete record</Text>
                            </Pressable>
                        </ScrollView>
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background }, screen: { flex: 1 },
    content: { width: "100%", maxWidth: 600, alignSelf: "center", padding: 22, paddingTop: 16, gap: 14 },
    back: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", paddingVertical: 8 }, backText: { color: colors.primary, fontWeight: "700" },
    headingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }, headingCopy: { flex: 1 }, selectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }, selectionHint: { flex: 1, color: colors.muted, fontSize: 11, lineHeight: 16 }, selectAllText: { color: colors.primary, fontSize: 12, fontWeight: "800" },
    eyebrow: { color: colors.primary, fontSize: 10, fontWeight: "800", letterSpacing: 1.4 }, title: { color: colors.text, fontSize: 27, fontWeight: "800", marginTop: 6 },
    exportButton: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 13 }, exportText: { color: colors.white, fontSize: 11, fontWeight: "800" }, disabled: { opacity: 0.45 },
    emptyCard: { alignItems: "center", backgroundColor: colors.surface, borderRadius: 22, borderWidth: 1, borderColor: colors.border, padding: 24, marginTop: 12 }, emptyIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.sageLight, alignItems: "center", justifyContent: "center" }, emptyTitle: { color: colors.text, fontWeight: "800", fontSize: 17, marginTop: 15, textAlign: "center" }, emptyText: { color: colors.muted, fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 8 },
    primaryButton: { backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 13, borderRadius: 14, marginTop: 18 }, primaryText: { color: colors.white, fontWeight: "800" },
    recordCard: { gap: 10, padding: 14, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, recordSelected: { borderColor: colors.primary, backgroundColor: "#F1F6EF" }, recordSelectRow: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 54 }, recordIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.sageLight }, recordThumbnail: { width: 54, height: 54, borderRadius: 13, backgroundColor: colors.sageLight }, recordCopy: { flex: 1, gap: 4 }, recordName: { color: colors.text, fontSize: 15, fontWeight: "800" }, recordStatus: { color: colors.primary, fontSize: 13, fontWeight: "700" }, recordDate: { color: colors.muted, fontSize: 11 }, demoTag: { color: "#8C3B16", fontSize: 9, fontWeight: "800", marginTop: 4 },
    recordActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 }, recordActionButton: { minWidth: 82, minHeight: 38, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 11, paddingHorizontal: 10, backgroundColor: colors.sageLight }, recordActionText: { color: colors.primary, fontSize: 12, fontWeight: "800" }, deleteAction: { backgroundColor: "#FCECEC" }, deleteText: { color: colors.danger },
    detailBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(15,31,23,0.45)" }, detailSheet: { width: "100%", maxWidth: 600, maxHeight: "90%", alignSelf: "center", padding: 22, paddingBottom: 30, borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: colors.background, gap: 10 }, detailHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, detailTitle: { color: colors.text, fontSize: 20, fontWeight: "800" }, closeButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface }, detailName: { color: colors.text, fontSize: 19, fontWeight: "800", marginTop: 4 }, detailMeta: { color: colors.muted, fontSize: 12 }, detailResult: { color: colors.primary, fontSize: 15, fontWeight: "800", marginTop: 5 }, detailDemo: { color: "#8C3B16", fontSize: 11, fontWeight: "800", backgroundColor: "#FFF0DF", padding: 10, borderRadius: 10 }, detailImage: { width: "100%", height: 280, borderRadius: 16, backgroundColor: "#E8EDEF", marginTop: 6 }, noImage: { height: 140, borderRadius: 16, alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.surface }, noImageText: { color: colors.muted, fontSize: 12 }, detailDisclaimer: { color: colors.muted, fontSize: 11, lineHeight: 17 }, detailDelete: { alignSelf: "flex-end", marginTop: 4 },
    disclaimer: { flexDirection: "row", alignItems: "flex-start", gap: 9, backgroundColor: colors.sageLight, borderRadius: 14, padding: 13, marginTop: 8 }, disclaimerText: { flex: 1, color: colors.primaryDark, fontSize: 11, lineHeight: 17 },
});
