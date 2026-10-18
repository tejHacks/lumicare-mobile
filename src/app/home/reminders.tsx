import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import BottomNav from "../../components/layout/BottomNav";
import AppButton from "../../components/ui/AppButton";
import colors from "../../constants/colors";
import { useLanguage } from "../../i18n/LanguageProvider";
import { CareReminder, useAppStore } from "../../stores/appStore";

type Reminder = CareReminder;

function formatDate(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function RemindersScreen() {
    const { t, screenText } = useLanguage();
    const insets = useSafeAreaInsets();
    const reminders = useAppStore((state) => state.reminders);
    const setReminders = useAppStore((state) => state.setReminders);
    const [title, setTitle] = useState("");
    const [notes, setNotes] = useState("");
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState(() => {
        const time = new Date();
        time.setHours(9, 0, 0, 0);
        return time;
    });
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerMode, setPickerMode] = useState<"date" | "time">("date");
    const [tempDate, setTempDate] = useState(() => new Date(Date.now() + 86400000));

    function openDatePicker() {
        const initial = selectedDate ?? new Date(Date.now() + 86400000);
        if (Platform.OS === "android") {
            DateTimePickerAndroid.open({ value: initial, mode: "date", minimumDate: new Date(), onValueChange: (_, date) => setSelectedDate(date) });
        } else {
            setTempDate(initial);
            setPickerMode("date");
            setPickerOpen(true);
        }
    }

    function openTimePicker() {
        if (Platform.OS === "android") {
            DateTimePickerAndroid.open({
                value: selectedTime,
                mode: "time",
                onValueChange: (_, time) => setSelectedTime(time),
            });
        } else {
            setTempDate(selectedTime);
            setPickerMode("time");
            setPickerOpen(true);
        }
    }

    async function createReminder() {
        if (!title.trim() || !selectedDate) {
            Alert.alert("Reminder details needed", "Add a care reminder and choose its date.");
            return;
        }
        const fireDate = new Date(selectedDate);
        fireDate.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
        if (fireDate.getTime() <= Date.now()) {
            Alert.alert("Choose a future date", "Select a date and time that have not passed.");
            return;
        }
        try {
            let notificationId: string | undefined;
            const supportsNativeScheduling =
                Platform.OS !== "web" &&
                Constants.executionEnvironment !== Constants.ExecutionEnvironment.StoreClient;
            if (supportsNativeScheduling) {
                try {
                    const Notifications = await import("expo-notifications");
                    const permission = await Notifications.getPermissionsAsync();
                    const granted = permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
                    if (granted || (await Notifications.requestPermissionsAsync()).granted) {
                        if (Platform.OS === "android") {
                            await Notifications.setNotificationChannelAsync("care-reminders", { name: "Care reminders", importance: Notifications.AndroidImportance.DEFAULT });
                        }
                        notificationId = await Notifications.scheduleNotificationAsync({
                            content: { title: title.trim(), body: notes.trim() || "Clinician-recommended follow-up reminder.", data: { url: "/home/reminders" } },
                            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireDate },
                        });
                    }
                } catch {
                    // Expo Go may not provide the native notification module. The reminder is still saved locally.
                }
            }
            const reminder: Reminder = { id: `${Date.now()}`, title: title.trim(), notes: notes.trim(), date: fireDate.toISOString(), notificationId };
            const updated = [...reminders, reminder].sort((a, b) => a.date.localeCompare(b.date));
            setReminders(updated);
            setTitle(""); setNotes(""); setSelectedDate(null);
            if (!notificationId) Alert.alert("Reminder saved", "It is saved in the app, but notifications are not enabled on this device.");
        } catch {
            Alert.alert("Unable to create reminder", "Please check notification permission and try again.");
        }
    }

    async function removeReminder(reminder: Reminder) {
        try {
            const supportsNativeScheduling =
                Platform.OS !== "web" &&
                Constants.executionEnvironment !== Constants.ExecutionEnvironment.StoreClient;
            if (reminder.notificationId && supportsNativeScheduling) {
                try {
                    const Notifications = await import("expo-notifications");
                    await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
                } catch {
                    // Removing the saved reminder should still work without native notification support.
                }
            }
            const updated = reminders.filter((item) => item.id !== reminder.id);
            setReminders(updated);
        } catch {
            Alert.alert("Unable to delete", "Please try again.");
        }
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
            <View style={styles.screen}>
                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={20} color={colors.primary} /><Text style={styles.backText}>{t("home")}</Text></Pressable>
                    <Text style={styles.eyebrow}>LUMICARE · CARE PLAN</Text>
                    <Text style={styles.title}>{t("reminders")}</Text>
                    <Text style={styles.subtitle}>{t("doctorInstructions")}</Text>
                    <View style={styles.photoAdvice}>
                        <Ionicons name="eye-outline" size={19} color={colors.primary} />
                        <Text style={styles.photoAdviceText}>{screenText("prepareBabyText")} {screenText("captureEyeText")} {screenText("eyeClear")}</Text>
                    </View>
                    <View style={styles.form}>
                        <Text style={styles.label}>{t("reminderTitle")}</Text>
                        <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Contact health worker" placeholderTextColor="#9AA59B" style={styles.input} maxLength={90} />
                        <Text style={styles.label}>{t("date")}</Text>
                        <Pressable accessibilityRole="button" onPress={openDatePicker} style={styles.dateButton}><Ionicons name="calendar-outline" size={19} color={colors.primary} /><Text style={[styles.dateText, !selectedDate && styles.placeholder]}>{selectedDate ? formatDate(selectedDate) : "Choose follow-up date"}</Text></Pressable>
                        <Text style={styles.label}>{t("time")}</Text>
                        <Pressable accessibilityRole="button" onPress={openTimePicker} style={styles.dateButton}><Ionicons name="time-outline" size={19} color={colors.primary} /><Text style={styles.dateText}>{selectedTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text></Pressable>
                        <Text style={styles.label}>{t("notes")}</Text>
                        <TextInput value={notes} onChangeText={setNotes} placeholder={t("doctorInstructions")} placeholderTextColor="#9AA59B" style={[styles.input, styles.notesInput]} multiline maxLength={300} />
                        <AppButton title={t("newReminder")} onPress={() => void createReminder()} style={styles.submit} />
                    </View>
                    <Text style={styles.sectionTitle}>{t("reminders")}</Text>
                    {reminders.length === 0 ? <View style={styles.empty}><Ionicons name="notifications-outline" size={24} color={colors.primary} /><Text style={styles.emptyText}>No reminders yet. Add dates recommended by the baby&apos;s clinician.</Text></View> : reminders.map((reminder) => (
                        <View key={reminder.id} style={styles.reminderCard}>
                            <View style={styles.reminderIcon}><Ionicons name="calendar" size={20} color={colors.primary} /></View>
                            <View style={styles.reminderCopy}><Text style={styles.reminderTitle}>{reminder.title}</Text><Text style={styles.reminderDate}>{new Date(reminder.date).toLocaleString()}</Text>{reminder.notes ? <Text style={styles.reminderNotes}>{reminder.notes}</Text> : null}</View>
                            <Pressable accessibilityRole="button" accessibilityLabel={t("delete")} onPress={() => void removeReminder(reminder)} style={styles.delete}><Ionicons name="trash-outline" size={19} color="#A94442" /></Pressable>
                        </View>
                    ))}
                    <View style={styles.disclaimer}><Ionicons name="information-circle-outline" size={18} color={colors.primary} /><Text style={styles.disclaimerText}>Reminders support the plan set by a clinician and are not a substitute for urgent care.</Text></View>
                </ScrollView>
                <BottomNav />
            </View>
            {Platform.OS === "ios" && <DateTimePickerModal visible={pickerOpen} mode={pickerMode} date={tempDate} insetsBottom={insets.bottom} onChange={setTempDate} onCancel={() => setPickerOpen(false)} onDone={() => { if (pickerMode === "date") setSelectedDate(tempDate); else setSelectedTime(tempDate); setPickerOpen(false); }} />}
        </SafeAreaView>
    );
}

function DateTimePickerModal({ visible, mode, date, insetsBottom, onChange, onCancel, onDone }: { visible: boolean; mode: "date" | "time"; date: Date; insetsBottom: number; onChange: (date: Date) => void; onCancel: () => void; onDone: () => void }) {
    const { t } = useLanguage();
    return <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}><View style={styles.modalBackdrop}><Pressable style={StyleSheet.absoluteFill} onPress={onCancel} /><View style={[styles.pickerSheet, { paddingBottom: insetsBottom + 14 }]}><View style={styles.pickerHeader}><Pressable onPress={onCancel}><Text style={styles.pickerAction}>{t("cancel")}</Text></Pressable><Text style={styles.pickerTitle}>{mode === "date" ? t("date") : t("time")}</Text><Pressable onPress={onDone}><Text style={styles.pickerAction}>{t("done")}</Text></Pressable></View><DateTimePicker value={date} mode={mode} display="spinner" minimumDate={mode === "date" ? new Date() : undefined} onValueChange={(_, value) => onChange(value)} /></View></View></Modal>;
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background }, screen: { flex: 1 }, content: { width: "100%", maxWidth: 600, alignSelf: "center", padding: 22, paddingTop: 16, gap: 13 },
    back: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", paddingVertical: 8 }, backText: { color: colors.primary, fontWeight: "700" }, eyebrow: { color: colors.primary, fontSize: 10, fontWeight: "800", letterSpacing: 1.3 }, title: { color: colors.text, fontSize: 28, fontWeight: "800", marginTop: -7 }, subtitle: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: -6 },
    form: { gap: 10, padding: 16, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, label: { color: colors.text, fontSize: 12, fontWeight: "700", marginTop: 3 }, input: { minHeight: 49, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, paddingHorizontal: 13, color: colors.text }, notesInput: { minHeight: 76, paddingTop: 12, textAlignVertical: "top" }, dateButton: { minHeight: 49, flexDirection: "row", alignItems: "center", gap: 9, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, paddingHorizontal: 13 }, dateText: { color: colors.text, fontSize: 13 }, placeholder: { color: "#9AA59B" }, submit: { marginTop: 4 },
    sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "800", marginTop: 4 }, empty: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.sageLight, borderRadius: 15, padding: 14 }, emptyText: { flex: 1, color: colors.muted, fontSize: 12, lineHeight: 18 }, reminderCard: { flexDirection: "row", alignItems: "flex-start", gap: 11, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 17, padding: 14 }, reminderIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.sageLight, alignItems: "center", justifyContent: "center" }, reminderCopy: { flex: 1, gap: 4 }, reminderTitle: { color: colors.text, fontSize: 14, fontWeight: "800" }, reminderDate: { color: colors.primary, fontSize: 12, fontWeight: "700" }, reminderNotes: { color: colors.muted, fontSize: 11, lineHeight: 16 }, delete: { padding: 7 },
    photoAdvice: { flexDirection: "row", alignItems: "flex-start", gap: 9, padding: 12, backgroundColor: colors.sageLight, borderRadius: 14 }, photoAdviceText: { flex: 1, color: colors.primaryDark, fontSize: 11, lineHeight: 17 }, disclaimer: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, backgroundColor: colors.sageLight, borderRadius: 14 }, disclaimerText: { flex: 1, color: colors.primaryDark, fontSize: 11, lineHeight: 17 }, modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(15,31,23,0.4)" }, pickerSheet: { backgroundColor: colors.background, borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingTop: 18, paddingHorizontal: 20 }, pickerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }, pickerTitle: { color: colors.text, fontWeight: "800", fontSize: 16 }, pickerAction: { color: colors.primary, fontWeight: "800", padding: 6 },
});
