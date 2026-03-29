import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ContainerProps {
  children: ReactNode;
  backgroundColor?: string;
}

export default function Container({
  children,
  backgroundColor = "#DDEDDD",
}: ContainerProps) {
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor }]}
    >
      <View style={[styles.container, { backgroundColor }]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});
