import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "../../constants/colors";
import { useLanguage } from "../../i18n/LanguageProvider";

const items = [
  { labelKey: "home", route: "/home", icon: "home-outline", activeIcon: "home" },
  { labelKey: "scan", route: "/home/scan", icon: "scan-outline", activeIcon: "scan" },
  { labelKey: "settings", route: "/home/setting", icon: "settings-outline", activeIcon: "settings" },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {items.map((item) => {
        const active = item.labelKey === "home" ? pathname === "/home" : pathname === item.route;

        return (
          <Pressable
            key={item.labelKey}
            accessibilityRole="button"
            accessibilityLabel={t(item.labelKey)}
            accessibilityState={{ selected: active }}
            onPress={() => router.replace(item.route)}
            style={styles.item}
          >
            <View style={styles.iconWrap}>
              <Ionicons
                name={active ? item.activeIcon : item.icon}
                size={24}
                color={active ? colors.primary : colors.muted}
              />
            </View>
            <Text style={[styles.label, active && styles.activeLabel]}>
              {t(item.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-evenly",
    paddingTop: 7,
    paddingHorizontal: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
    minHeight: 50,
    paddingHorizontal: 2,
    gap: 2,
  },
  iconWrap: {
    width: 36,
    height: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.muted,
    textAlign: "center",
  },
  activeLabel: {
    color: colors.primary,
    fontWeight: "800",
  },
});
