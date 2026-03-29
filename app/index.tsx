import Container from "@/components/container";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Mode = "focus" | "shortBreak" | "longBreak";

type ModeConfig = {
  label: string;
  minutes: number;
  accent: string;
  background: string;
  tint: string;
  glow: string;
  blobTop: string;
  blobBottom: string;
  text: string;
  mutedText: string;
};

const MODE_ORDER: Mode[] = ["focus", "shortBreak", "longBreak"];

const MODE_CONFIG: Record<Mode, ModeConfig> = {
  focus: {
    label: "focus",
    minutes: 25,
    accent: "#5B8F6A",
    background: "#DDEDDD",
    tint: "#F2FBF0",
    glow: "#C6E0C6",
    blobTop: "rgba(242, 251, 240, 0.8)",
    blobBottom: "rgba(232, 245, 232, 0.75)",
    text: "#4E6655",
    mutedText: "#88A08D",
  },
  shortBreak: {
    label: "short break",
    minutes: 5,
    accent: "#D7925B",
    background: "#F7E7D9",
    tint: "#FFF3E8",
    glow: "#F3D7BF",
    blobTop: "rgba(255, 244, 233, 0.84)",
    blobBottom: "rgba(248, 226, 204, 0.78)",
    text: "#7C5B3F",
    mutedText: "#B08A6D",
  },
  longBreak: {
    label: "long break",
    minutes: 15,
    accent: "#D86F7C",
    background: "#F3E0E4",
    tint: "#FFF0F2",
    glow: "#F2CFD5",
    blobTop: "rgba(255, 242, 245, 0.84)",
    blobBottom: "rgba(245, 214, 221, 0.78)",
    text: "#7F5460",
    mutedText: "#B38B95",
  },
};

const CYCLE_TARGET = 4;
const completionSound = require("../assets/sounds/chime.wav");

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function Index() {
  const [mode, setMode] = useState<Mode>("focus");
  const [secondsLeft, setSecondsLeft] = useState(
    MODE_CONFIG.focus.minutes * 60,
  );
  const [isRunning, setIsRunning] = useState(false);
  const [completedFocusSessions, setCompletedFocusSessions] = useState(0);
  const [completedCycles, setCompletedCycles] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  const currentConfig = MODE_CONFIG[mode];

  const switchMode = useCallback((nextMode: Mode) => {
    setMode(nextMode);
    setSecondsLeft(MODE_CONFIG[nextMode].minutes * 60);
    setIsRunning(false);
  }, []);

  useEffect(() => {
    async function prepareSound() {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const { sound } = await Audio.Sound.createAsync(completionSound);
      soundRef.current = sound;
    }

    void prepareSound();

    return () => {
      if (soundRef.current) {
        void soundRef.current.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning]);

  useEffect(() => {
    if (secondsLeft > 0 || !isRunning) {
      return;
    }

    if (soundRef.current) {
      void soundRef.current.replayAsync();
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsRunning(false);

    if (mode === "focus") {
      const nextCompletedSessions = completedFocusSessions + 1;
      const shouldUseLongBreak = nextCompletedSessions % CYCLE_TARGET === 0;

      setCompletedFocusSessions(nextCompletedSessions);
      if (shouldUseLongBreak) {
        setCompletedCycles((current) => current + 1);
      }

      switchMode(shouldUseLongBreak ? "longBreak" : "shortBreak");
      return;
    }

    switchMode("focus");
  }, [completedFocusSessions, isRunning, mode, secondsLeft, switchMode]);

  function toggleTimer() {
    void Haptics.selectionAsync();
    setIsRunning((current) => !current);
  }

  function resetCurrentTimer() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSecondsLeft(MODE_CONFIG[mode].minutes * 60);
    setIsRunning(false);
  }

  return (
    <Container backgroundColor={currentConfig.background}>
      <StatusBar style="dark" backgroundColor={currentConfig.background} />
      <View style={[styles.screen, { backgroundColor: currentConfig.background }]}>
        <View style={[styles.bgBlobTop, { backgroundColor: currentConfig.blobTop }]} />
        <View
          style={[styles.bgBlobBottom, { backgroundColor: currentConfig.blobBottom }]}
        />
        <View style={styles.orbWrap}>
          <View
            style={[styles.orbShadow, { backgroundColor: currentConfig.glow }]}
          />
          <Pressable
            onPress={toggleTimer}
            onLongPress={resetCurrentTimer}
            delayLongPress={320}
            style={[
              styles.timerOrb,
              {
                backgroundColor: currentConfig.tint,
                borderColor: "rgba(255,255,255,0.65)",
              },
            ]}
          >
            <Text style={[styles.stateText, { color: currentConfig.accent }]}>
              {isRunning ? "pause" : "start"}
            </Text>
            <Text style={[styles.timerText, { color: currentConfig.text }]}>
              {formatTime(secondsLeft)}
            </Text>
            <Text style={[styles.hintText, { color: currentConfig.mutedText }]}>
              tap to play or pause
            </Text>
            <Text style={[styles.hintText, { color: currentConfig.mutedText }]}>
              hold to reset
            </Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <View style={styles.modeStrip}>
            {MODE_ORDER.map((item) => {
              const itemConfig = MODE_CONFIG[item];
              const active = item === mode;

              return (
                <Pressable
                  key={item}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    switchMode(item);
                  }}
                  style={styles.modeItem}
                >
                  <Text
                    style={[
                      styles.modeLabel,
                      {
                        color: active ? itemConfig.accent : currentConfig.mutedText,
                        opacity: active ? 1 : 0.72,
                      },
                    ]}
                  >
                    {itemConfig.label}
                  </Text>
                  {active ? (
                    <View
                      style={[
                        styles.modeDot,
                        { backgroundColor: itemConfig.accent },
                      ]}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.footerText, { color: currentConfig.mutedText }]}>
            tap mode untuk ganti
          </Text>
          <Text style={[styles.footerText, { color: currentConfig.mutedText }]}>
            {completedFocusSessions} sesi • {completedCycles} cycle
          </Text>
        </View>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 26,
  },
  bgBlobTop: {
    position: "absolute",
    top: 34,
    right: 18,
    width: 118,
    height: 118,
    borderRadius: 999,
  },
  bgBlobBottom: {
    position: "absolute",
    left: 10,
    bottom: 84,
    width: 148,
    height: 148,
    borderRadius: 999,
  },
  orbWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  orbShadow: {
    position: "absolute",
    width: 298,
    height: 298,
    borderRadius: 999,
    opacity: 0.92,
    transform: [{ scale: 1.08 }],
  },
  timerOrb: {
    width: "100%",
    maxWidth: 340,
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  stateText: {
    fontSize: 15,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.3,
  },
  timerText: {
    marginTop: 10,
    fontSize: 64,
    lineHeight: 72,
    fontWeight: "800",
    letterSpacing: -2,
  },
  hintText: {
    marginTop: 6,
    fontSize: 13,
  },
  footer: {
    alignItems: "center",
    gap: 10,
    paddingBottom: 4,
  },
  modeStrip: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 20,
  },
  modeItem: {
    alignItems: "center",
    minWidth: 70,
    gap: 6,
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  modeDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  footerText: {
    fontSize: 12,
  },
});
