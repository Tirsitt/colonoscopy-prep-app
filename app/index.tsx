import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

function FeatureCard({
  title,
  subtitle,
  iconName,
  iconSet,
  color,
  onPress,
}: {
  title: string;
  subtitle: string;
  iconName: string;
  iconSet: "ionicons" | "material-community";
  color: string;
  onPress: () => void;
}) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        { transform: [{ scale: pressed ? 0.97 : 1 }], opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={[styles.cardIconContainer, { backgroundColor: color + "18" }]}>
        {iconSet === "ionicons" ? (
          <Ionicons name={iconName as any} size={32} color={color} />
        ) : (
          <MaterialCommunityIcons name={iconName as any} size={32} color={color} />
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color={Colors.light.textSecondary} />
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#1B3A5C", "#4A90D9"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.header,
          { paddingTop: insets.top + webTopInset + 24 },
        ]}
      >
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="medical-bag" size={36} color="#FFFFFF" />
        </View>
        <Text style={styles.headerTitle}>MedPrep</Text>
        <Text style={styles.headerSubtitle}>
          Practice clinical procedures and preparation protocols
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.sectionLabel}>TRAINING MODULES</Text>

        <FeatureCard
          title="Antibiotic Sequencing"
          subtitle="Order the steps to prepare powdered antibiotics correctly"
          iconName="flask"
          iconSet="ionicons"
          color={Colors.light.primary}
          onPress={() => router.push("/game")}
        />

        <FeatureCard
          title="Colonoscopy Prep"
          subtitle="Track dietary, medication, and procedure day tasks"
          iconName="clipboard-check-outline"
          iconSet="material-community"
          color={Colors.light.secondary}
          onPress={() => router.push("/checklist")}
        />
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16) }]}>
        <Text style={styles.footerText}>For educational purposes only</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
    lineHeight: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textSecondary,
    letterSpacing: 1.2,
    marginBottom: 16,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#1B3A5C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  cardIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  footer: {
    alignItems: "center",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
});
