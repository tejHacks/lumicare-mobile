import { View, StyleSheet } from "react-native";
import colors from "../../constants/colors";

type Props = {
  current: number;
  total: number;
};

export default function ProgressDots({ current, total }: Props) {
  return (
    <View
      accessibilityLabel={`Onboarding step ${current + 1} of ${total}`}
      style={styles.container}
    >
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={[styles.dot, index === current && styles.activeDot]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  dot: {
    height: 7,
    width: 7,
    borderRadius: 10,
    backgroundColor: "#D6DED4",
  },
  activeDot: {
    width: 26,
    backgroundColor: colors.primary,
  },
});
