import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import colors from "../constants/colors";
import { initializeDatabase } from "../db/database";
import { LanguageProvider } from "../i18n/LanguageProvider";

export default function RootLayout() {
  const [databaseReady, setDatabaseReady] = useState(false);
  const [databaseError, setDatabaseError] = useState<string | null>(null);

  useEffect(() => {
    initializeDatabase().then(() => setDatabaseReady(true)).catch((error: unknown) => {
      setDatabaseError(error instanceof Error ? error.message : "Unable to open local data storage.");
    });
  }, []);

  if (databaseError) {
    return <View style={styles.message}><Text style={styles.errorTitle}>LumiCare storage is unavailable</Text><Text style={styles.errorText}>{databaseError}</Text></View>;
  }
  if (!databaseReady) {
    return <View style={styles.message}><ActivityIndicator color={colors.primary} /><Text style={styles.loadingText}>Preparing secure on-device storage…</Text></View>;
  }

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  message: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 28, backgroundColor: colors.background },
  errorTitle: { color: colors.text, fontSize: 18, fontWeight: "800", textAlign: "center" },
  errorText: { color: colors.muted, fontSize: 13, textAlign: "center" },
  loadingText: { color: colors.muted, fontSize: 13 },
});
