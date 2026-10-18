import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import colors from "../constants/colors";
import { useAppStore } from "../stores/appStore";

export default function Index() {
  const profile = useAppStore((state) => state.caregiverProfile);
  const hydrated = useAppStore((state) => state.hydrated);
  if (!hydrated) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  const hasProfile = Boolean(profile?.firstName.trim() && profile.lastName.trim());
  return <Redirect href={hasProfile ? "/home" : "/(onboarding)/welcome"} />;
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
