import React, { useState, useEffect, useCallback } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

const STORAGE_KEY = "colonoscopy_checklist";

const PHASES = [
  {
    id: "dietary",
    title: "Dietary Preparation",
    subtitle: "5-7 days before procedure",
    icon: "nutrition" as const,
    iconSet: "ionicons" as const,
    color: "#FF9500",
    tasks: [
      { id: "d1", text: "Stop eating high-fiber foods (seeds, nuts, popcorn)" },
      { id: "d2", text: "Avoid red or purple foods and drinks" },
      { id: "d3", text: "Switch to a low-residue diet" },
      { id: "d4", text: "Increase clear liquid intake" },
      { id: "d5", text: "Day before: clear liquids only (broth, gelatin, clear juice)" },
    ],
  },
  {
    id: "medication",
    title: "Medication Review",
    subtitle: "3-7 days before procedure",
    icon: "pill" as const,
    iconSet: "material-community" as const,
    color: "#4A90D9",
    tasks: [
      { id: "m1", text: "Discuss blood thinners with physician (stop if directed)" },
      { id: "m2", text: "Review iron supplement usage (stop if directed)" },
      { id: "m3", text: "Pick up prescribed bowel prep solution" },
      { id: "m4", text: "Begin bowel prep as directed (evening before)" },
      { id: "m5", text: "Complete second dose of bowel prep (morning of, if split-dose)" },
    ],
  },
  {
    id: "procedure",
    title: "Procedure Day",
    subtitle: "Day of colonoscopy",
    icon: "medical" as const,
    iconSet: "ionicons" as const,
    color: "#2E9E9E",
    tasks: [
      { id: "p1", text: "Nothing to eat or drink (NPO) from midnight" },
      { id: "p2", text: "Take only approved medications with small sip of water" },
      { id: "p3", text: "Arrange transportation home (no driving after sedation)" },
      { id: "p4", text: "Wear comfortable, loose-fitting clothing" },
      { id: "p5", text: "Bring insurance card, ID, and signed consent forms" },
      { id: "p6", text: "Arrive at facility at scheduled time" },
    ],
  },
];

function PhaseHeader({
  phase,
  completedCount,
  totalCount,
  expanded,
  onToggle,
}: {
  phase: (typeof PHASES)[0];
  completedCount: number;
  totalCount: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const progress = totalCount > 0 ? completedCount / totalCount : 0;
  const isComplete = completedCount === totalCount;

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggle();
      }}
      style={({ pressed }) => [
        styles.phaseHeader,
        { opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={[styles.phaseIconWrap, { backgroundColor: phase.color + "18" }]}>
        {phase.iconSet === "ionicons" ? (
          <Ionicons name={phase.icon as any} size={24} color={phase.color} />
        ) : (
          <MaterialCommunityIcons name={phase.icon as any} size={24} color={phase.color} />
        )}
      </View>
      <View style={styles.phaseInfo}>
        <Text style={styles.phaseTitle}>{phase.title}</Text>
        <Text style={styles.phaseSubtitle}>{phase.subtitle}</Text>
        <View style={styles.phaseProgressRow}>
          <View style={styles.phaseProgressBar}>
            <View
              style={[
                styles.phaseProgressFill,
                {
                  width: `${progress * 100}%`,
                  backgroundColor: isComplete ? Colors.light.success : phase.color,
                },
              ]}
            />
          </View>
          <Text style={styles.phaseProgressText}>
            {completedCount}/{totalCount}
          </Text>
        </View>
      </View>
      <Ionicons
        name={expanded ? "chevron-up" : "chevron-down"}
        size={20}
        color={Colors.light.textSecondary}
      />
    </Pressable>
  );
}

function TaskItem({
  task,
  checked,
  onToggle,
  color,
  index,
}: {
  task: { id: string; text: string };
  checked: boolean;
  onToggle: () => void;
  color: string;
  index: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle();
        }}
        style={({ pressed }) => [
          styles.taskItem,
          {
            backgroundColor: checked ? Colors.light.success + "08" : Colors.light.card,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <View
          style={[
            styles.checkbox,
            checked
              ? { backgroundColor: Colors.light.success, borderColor: Colors.light.success }
              : { borderColor: color + "60" },
          ]}
        >
          {checked && <Ionicons name="checkmark" size={16} color="#FFF" />}
        </View>
        <Text
          style={[
            styles.taskText,
            checked && {
              textDecorationLine: "line-through",
              color: Colors.light.textSecondary,
            },
          ]}
        >
          {task.text}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function ChecklistScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({
    dietary: true,
    medication: true,
    procedure: true,
  });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) {
        setCheckedTasks(JSON.parse(val));
      }
    });
  }, []);

  const saveChecked = useCallback(
    (updated: Record<string, boolean>) => {
      setCheckedTasks(updated);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    },
    []
  );

  const toggleTask = useCallback(
    (taskId: string) => {
      const updated = { ...checkedTasks, [taskId]: !checkedTasks[taskId] };
      saveChecked(updated);
    },
    [checkedTasks, saveChecked]
  );

  const togglePhase = useCallback((phaseId: string) => {
    setExpandedPhases((prev) => ({ ...prev, [phaseId]: !prev[phaseId] }));
  }, []);

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    saveChecked({});
  };

  const totalTasks = PHASES.reduce((sum, p) => sum + p.tasks.length, 0);
  const totalChecked = Object.values(checkedTasks).filter(Boolean).length;
  const allComplete = totalChecked === totalTasks;

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
          <Text style={styles.topBarTitle}>Colonoscopy Prep</Text>
        </View>
        <Pressable onPress={handleReset} style={styles.resetButton}>
          <Ionicons name="refresh" size={22} color={Colors.light.primary} />
        </Pressable>
      </View>

      <View style={styles.summaryBar}>
        <View style={styles.summaryProgressBar}>
          <View
            style={[
              styles.summaryProgressFill,
              {
                width: `${totalTasks > 0 ? (totalChecked / totalTasks) * 100 : 0}%`,
                backgroundColor: allComplete ? Colors.light.success : Colors.light.primary,
              },
            ]}
          />
        </View>
        <Text style={styles.summaryText}>
          {allComplete
            ? "All tasks complete!"
            : `${totalChecked} of ${totalTasks} tasks completed`}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + webBottomInset + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {PHASES.map((phase) => {
          const completedCount = phase.tasks.filter(
            (t) => checkedTasks[t.id]
          ).length;
          const expanded = expandedPhases[phase.id] !== false;

          return (
            <View key={phase.id} style={styles.phaseCard}>
              <PhaseHeader
                phase={phase}
                completedCount={completedCount}
                totalCount={phase.tasks.length}
                expanded={expanded}
                onToggle={() => togglePhase(phase.id)}
              />
              {expanded && (
                <View style={styles.tasksContainer}>
                  {phase.tasks.map((task, idx) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      checked={!!checkedTasks[task.id]}
                      onToggle={() => toggleTask(task.id)}
                      color={phase.color}
                      index={idx}
                    />
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
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
  summaryBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.divider,
  },
  summaryProgressBar: {
    height: 6,
    backgroundColor: Colors.light.primaryLight,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  summaryProgressFill: {
    height: "100%",
    borderRadius: 3,
  },
  summaryText: {
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
  phaseCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    overflow: "hidden",
    shadowColor: "#1B3A5C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  phaseHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
  },
  phaseIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  phaseInfo: {
    flex: 1,
    marginRight: 8,
  },
  phaseTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    marginBottom: 2,
  },
  phaseSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  phaseProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  phaseProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.light.primaryLight,
    borderRadius: 2,
    overflow: "hidden",
  },
  phaseProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
  phaseProgressText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
    width: 30,
    textAlign: "right",
  },
  tasksContainer: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  taskText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    lineHeight: 20,
  },
});
