import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

const CORRECT_ORDER = [
  "Check the medication order and verify the antibiotic name, dose, and diluent",
  "Perform hand hygiene and gather supplies (vial, diluent, syringe, alcohol swabs)",
  "Inspect the powdered vial for expiration date, cracks, and discoloration",
  "Clean the rubber stopper of the vial with an alcohol swab",
  "Draw the correct volume of diluent into a syringe",
  "Inject the diluent slowly into the powdered vial",
  "Gently swirl or roll the vial until the powder is fully dissolved",
  "Inspect the reconstituted solution for clarity and particulates",
  "Label the vial with the date, time, concentration, and your initials",
  "Store the reconstituted antibiotic per manufacturer guidelines",
];

function shuffleArray(arr: string[]): string[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  if (shuffled.every((item, idx) => item === arr[idx])) {
    return shuffleArray(arr);
  }
  return shuffled;
}

function StepOption({
  text,
  index,
  onPress,
  status,
}: {
  text: string;
  index: number;
  onPress: () => void;
  status: "idle" | "correct" | "incorrect" | "used";
}) {
  const shake = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  const handlePress = () => {
    if (status === "used") return;
    onPress();
  };

  React.useEffect(() => {
    if (status === "incorrect") {
      shake.value = withSequence(
        withTiming(-8, { duration: 60 }),
        withTiming(8, { duration: 60 }),
        withTiming(-6, { duration: 60 }),
        withTiming(6, { duration: 60 }),
        withTiming(0, { duration: 60 })
      );
    }
  }, [status]);

  const bgColor =
    status === "correct"
      ? Colors.light.success + "15"
      : status === "incorrect"
      ? Colors.light.error + "15"
      : status === "used"
      ? Colors.light.background
      : Colors.light.card;

  const borderColor =
    status === "correct"
      ? Colors.light.success
      : status === "incorrect"
      ? Colors.light.error
      : status === "used"
      ? Colors.light.divider
      : Colors.light.cardBorder;

  const textColor =
    status === "used" ? Colors.light.textSecondary : Colors.light.text;

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={handlePress}
        disabled={status === "used"}
        style={({ pressed }) => [
          styles.stepOption,
          {
            backgroundColor: bgColor,
            borderColor: borderColor,
            opacity: status === "used" ? 0.5 : pressed ? 0.85 : 1,
            transform: [{ scale: pressed && status !== "used" ? 0.98 : 1 }],
          },
        ]}
      >
        <View style={styles.stepNumberBadge}>
          <Text style={styles.stepNumberText}>{index + 1}</Text>
        </View>
        <Text style={[styles.stepText, { color: textColor }]}>{text}</Text>
        {status === "correct" && (
          <Ionicons name="checkmark-circle" size={22} color={Colors.light.success} />
        )}
        {status === "incorrect" && (
          <Ionicons name="close-circle" size={22} color={Colors.light.error} />
        )}
      </Pressable>
    </Animated.View>
  );
}

function SelectedStep({ text, number }: { text: string; number: number }) {
  return (
    <Animated.View entering={FadeInDown.duration(300)} style={styles.selectedStep}>
      <View style={styles.selectedNumberBadge}>
        <Text style={styles.selectedNumberText}>{number}</Text>
      </View>
      <Text style={styles.selectedText} numberOfLines={2}>
        {text}
      </Text>
      <Ionicons name="checkmark" size={18} color={Colors.light.success} />
    </Animated.View>
  );
}

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const [shuffledSteps, setShuffledSteps] = useState<string[]>(() =>
    shuffleArray(CORRECT_ORDER)
  );
  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);
  const [stepStatuses, setStepStatuses] = useState<
    Record<string, "idle" | "correct" | "incorrect" | "used">
  >({});
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);

  const currentStep = selectedOrder.length;

  const handleStepPress = useCallback(
    (step: string) => {
      if (gameComplete) return;

      const isCorrect = step === CORRECT_ORDER[currentStep];

      if (isCorrect) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setStepStatuses((prev) => ({ ...prev, [step]: "used" }));
        setSelectedOrder((prev) => [...prev, step]);
        setScore((prev) => prev + 1);

        if (currentStep + 1 === CORRECT_ORDER.length) {
          setGameComplete(true);
        }
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setStepStatuses((prev) => ({ ...prev, [step]: "incorrect" }));
        setTimeout(() => {
          setStepStatuses((prev) => ({ ...prev, [step]: "idle" }));
        }, 800);
      }
    },
    [currentStep, gameComplete]
  );

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShuffledSteps(shuffleArray(CORRECT_ORDER));
    setSelectedOrder([]);
    setStepStatuses({});
    setScore(0);
    setGameComplete(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View
        style={[
          styles.topBar,
          { paddingTop: insets.top + webTopInset + 8 },
        ]}
      >
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </Pressable>
        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle}>Antibiotic Sequencing</Text>
        </View>
        <Pressable onPress={handleReset} style={styles.resetButton}>
          <Ionicons name="refresh" size={22} color={Colors.light.primary} />
        </Pressable>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(selectedOrder.length / CORRECT_ORDER.length) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {selectedOrder.length} / {CORRECT_ORDER.length} steps
        </Text>
      </View>

      {gameComplete ? (
        <Animated.View
          entering={FadeIn.duration(500)}
          style={[
            styles.completeContainer,
            { paddingBottom: insets.bottom + webBottomInset + 20 },
          ]}
        >
          <View style={styles.completeIconWrap}>
            <MaterialCommunityIcons
              name="check-decagram"
              size={64}
              color={Colors.light.success}
            />
          </View>
          <Text style={styles.completeTitle}>Excellent Work!</Text>
          <Text style={styles.completeSubtitle}>
            You correctly sequenced all {CORRECT_ORDER.length} steps for antibiotic reconstitution.
          </Text>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Score</Text>
            <Text style={styles.scoreValue}>
              {score}/{CORRECT_ORDER.length}
            </Text>
          </View>
          <Pressable
            onPress={handleReset}
            style={({ pressed }) => [
              styles.playAgainBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="refresh" size={20} color="#FFF" />
            <Text style={styles.playAgainText}>Play Again</Text>
          </Pressable>
        </Animated.View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + webBottomInset + 20 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {selectedOrder.length > 0 && (
            <View style={styles.selectedSection}>
              <Text style={styles.sectionLabel}>COMPLETED STEPS</Text>
              {selectedOrder.map((step, idx) => (
                <SelectedStep key={step} text={step} number={idx + 1} />
              ))}
            </View>
          )}

          <View style={styles.optionsSection}>
            <Text style={styles.sectionLabel}>
              {currentStep === 0
                ? "TAP THE FIRST STEP"
                : `TAP STEP ${currentStep + 1}`}
            </Text>
            {shuffledSteps.map((step, idx) => (
              <StepOption
                key={step}
                text={step}
                index={idx}
                status={stepStatuses[step] || "idle"}
                onPress={() => handleStepPress(step)}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.divider,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarCenter: {
    flex: 1,
    alignItems: "center",
  },
  topBarTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  resetButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  progressSection: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.divider,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.light.primaryLight,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.light.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  selectedSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textSecondary,
    letterSpacing: 1.2,
    marginBottom: 12,
    marginLeft: 4,
  },
  selectedStep: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.success + "10",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.success + "30",
  },
  selectedNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.light.success,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  selectedNumberText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#FFF",
  },
  selectedText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    marginRight: 8,
    lineHeight: 20,
  },
  optionsSection: {
    marginBottom: 20,
  },
  stepOption: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: "#1B3A5C",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.light.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.primary,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginRight: 8,
  },
  completeContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  completeIconWrap: {
    marginBottom: 20,
  },
  completeTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginBottom: 10,
  },
  completeSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  scoreCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 40,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    shadowColor: "#1B3A5C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  scoreLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    color: Colors.light.success,
  },
  playAgainBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    gap: 8,
  },
  playAgainText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#FFF",
  },
});
