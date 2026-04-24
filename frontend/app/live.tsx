import { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert as RNAlert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Audio } from "expo-av";
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, cancelAnimation,
} from "react-native-reanimated";
import { theme, spacing, radius } from "../src/theme";

type Mode = "menu" | "camera" | "audio" | "screen";

export default function Live() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string }>();
  const [mode, setMode] = useState<Mode>("menu");
  const childName = params.name || "a criança";

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={theme.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>MONITORAMENTO AO VIVO</Text>
          <Text style={styles.name}>{childName}</Text>
        </View>
        <View style={styles.liveDot}>
          <View style={styles.dotInner} />
          <Text style={styles.liveText}>AO VIVO</Text>
        </View>
      </View>

      {mode === "menu" && <MenuView onPick={setMode} />}
      {mode === "camera" && <CameraDemo onBack={() => setMode("menu")} />}
      {mode === "audio" && <AudioDemo onBack={() => setMode("menu")} />}
      {mode === "screen" && <ScreenDemo onBack={() => setMode("menu")} />}
    </SafeAreaView>
  );
}

function MenuView({ onPick }: { onPick: (m: Mode) => void }) {
  const items: { id: Mode; icon: any; t: string; d: string }[] = [
    { id: "camera", icon: "videocam", t: "Câmera remota", d: "Ativar a câmera traseira do dispositivo" },
    { id: "audio", icon: "mic", t: "Áudio unidirecional", d: "Ouvir o ambiente ao redor" },
    { id: "screen", icon: "phone-portrait", t: "Espelhamento de tela", d: "Ver a tela em tempo real" },
  ];
  return (
    <ScrollView contentContainerStyle={styles.menu}>
      <Text style={styles.intro}>
        Conecte-se visualmente e sonoramente com o dispositivo. Use com responsabilidade.
      </Text>
      {items.map((it) => (
        <TouchableOpacity
          key={it.id}
          testID={`live-${it.id}`}
          onPress={() => onPick(it.id)}
          activeOpacity={0.85}
          style={styles.card}
        >
          <View style={styles.cardIcon}>
            <Ionicons name={it.icon} size={22} color="#FFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{it.t}</Text>
            <Text style={styles.cardDesc}>{it.d}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.muted} />
        </TouchableOpacity>
      ))}
      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={16} color={theme.muted} />
        <Text style={styles.noteText}>
          Demonstração: a câmera usa o seu dispositivo. Áudio e tela são simulados.
        </Text>
      </View>
    </ScrollView>
  );
}

function CameraDemo({ onBack }: { onBack: () => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) {
    return <View style={styles.viewport} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.viewport}>
        <View style={styles.permWrap}>
          <Ionicons name="camera-outline" size={48} color="#FFF" />
          <Text style={styles.permTitle}>Acesso à câmera necessário</Text>
          <Text style={styles.permDesc}>
            Para ativar a câmera remota, precisamos da permissão do dispositivo.
          </Text>
          <TouchableOpacity testID="grant-cam-btn" onPress={requestPermission} style={styles.permBtn}>
            <Text style={styles.permBtnText}>Permitir</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.linkBack}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // On web, CameraView might not work reliably — show fallback
  if (Platform.OS === "web") {
    return (
      <FallbackCamera onBack={onBack} recording={recording} setRecording={setRecording} />
    );
  }

  return (
    <View style={styles.viewport}>
      <CameraView style={StyleSheet.absoluteFill} facing={facing} />
      <View style={styles.camControls}>
        <TouchableOpacity onPress={onBack} style={styles.camBtn}>
          <Ionicons name="close" size={22} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity
          testID="record-btn"
          onPress={() => setRecording((r) => !r)}
          style={[styles.recBtn, recording && styles.recBtnOn]}
        >
          <View style={[styles.recInner, recording && styles.recInnerOn]} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
          style={styles.camBtn}
        >
          <Ionicons name="camera-reverse" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>
      {recording && (
        <View style={styles.recBadge}>
          <View style={styles.recDot} />
          <Text style={styles.recText}>REC</Text>
        </View>
      )}
    </View>
  );
}

function FallbackCamera({
  onBack, recording, setRecording,
}: { onBack: () => void; recording: boolean; setRecording: (b: boolean) => void }) {
  return (
    <View style={styles.viewport}>
      <View style={styles.noiseBg}>
        {Array.from({ length: 30 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.noiseLine,
              { top: `${(i / 30) * 100}%`, opacity: 0.06 + (i % 3) * 0.02 },
            ]}
          />
        ))}
      </View>
      <View style={styles.camFallbackInner}>
        <Ionicons name="videocam" size={64} color="rgba(255,255,255,0.7)" />
        <Text style={styles.camFallbackText}>Transmissão ao vivo</Text>
        <Text style={styles.camFallbackSub}>Demo • câmera não disponível no navegador</Text>
      </View>
      <View style={styles.camControls}>
        <TouchableOpacity onPress={onBack} style={styles.camBtn}>
          <Ionicons name="close" size={22} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity
          testID="record-btn"
          onPress={() => setRecording(!recording)}
          style={[styles.recBtn, recording && styles.recBtnOn]}
        >
          <View style={[styles.recInner, recording && styles.recInnerOn]} />
        </TouchableOpacity>
        <View style={styles.camBtn} />
      </View>
      {recording && (
        <View style={styles.recBadge}>
          <View style={styles.recDot} />
          <Text style={styles.recText}>REC</Text>
        </View>
      )}
    </View>
  );
}

function AudioDemo({ onBack }: { onBack: () => void }) {
  const [listening, setListening] = useState(false);
  const [granted, setGranted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<any>(null);

  const start = async () => {
    try {
      const res = await Audio.requestPermissionsAsync();
      if (!res.granted) {
        RNAlert.alert("Permissão negada", "Habilite o microfone nas configurações.");
        return;
      }
      setGranted(true);
      setListening(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch {
      setGranted(true);
      setListening(true);
    }
  };

  const stop = () => {
    setListening(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  };

  return (
    <View style={styles.audioWrap}>
      <View style={styles.audioCenter}>
        <AudioRings active={listening} />
        <Text style={styles.audioTime} testID="audio-timer">{fmt(elapsed)}</Text>
        <Text style={styles.audioStatus}>
          {listening ? "Ouvindo ambiente..." : granted ? "Pronto para ouvir" : "Clique para iniciar"}
        </Text>
      </View>

      <Waveform active={listening} />

      <View style={styles.audioControls}>
        <TouchableOpacity onPress={onBack} style={styles.audioSecBtn}>
          <Ionicons name="chevron-back" size={20} color={theme.ink} />
          <Text style={styles.audioSecText}>Voltar</Text>
        </TouchableOpacity>
        {!listening ? (
          <TouchableOpacity testID="audio-start" onPress={start} style={styles.audioMainBtn}>
            <Ionicons name="mic" size={22} color="#FFF" />
            <Text style={styles.audioMainText}>Iniciar escuta</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity testID="audio-stop" onPress={stop} style={[styles.audioMainBtn, styles.audioStopBtn]}>
            <Ionicons name="stop" size={22} color="#FFF" />
            <Text style={styles.audioMainText}>Parar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function AudioRings({ active }: { active: boolean }) {
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);

  useEffect(() => {
    if (active) {
      scale1.value = withRepeat(withTiming(1.5, { duration: 1400 }), -1, false);
      scale2.value = withRepeat(
        withSequence(withTiming(1, { duration: 400 }), withTiming(1.8, { duration: 1400 })),
        -1, false
      );
    } else {
      cancelAnimation(scale1);
      cancelAnimation(scale2);
      scale1.value = withTiming(1);
      scale2.value = withTiming(1);
    }
  }, [active]);

  const r1 = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value }], opacity: 2 - scale1.value,
  }));
  const r2 = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }], opacity: 2 - scale2.value,
  }));

  return (
    <View style={styles.ringsWrap}>
      <Animated.View style={[styles.ring, r1]} />
      <Animated.View style={[styles.ring, r2]} />
      <View style={styles.ringCore}>
        <Ionicons name="mic" size={32} color="#FFF" />
      </View>
    </View>
  );
}

function Waveform({ active }: { active: boolean }) {
  return (
    <View style={styles.wave}>
      {Array.from({ length: 40 }).map((_, i) => (
        <WaveBar key={i} idx={i} active={active} />
      ))}
    </View>
  );
}

function WaveBar({ idx, active }: { idx: number; active: boolean }) {
  const h = useSharedValue(0.1);
  useEffect(() => {
    if (active) {
      const loop = () => {
        h.value = withTiming(Math.random() * 0.9 + 0.1, { duration: 250 + (idx % 5) * 50 });
      };
      loop();
      const id = setInterval(loop, 300);
      return () => clearInterval(id);
    } else {
      h.value = withTiming(0.1, { duration: 300 });
    }
  }, [active, idx]);
  const s = useAnimatedStyle(() => ({ height: `${h.value * 100}%` }));
  return <Animated.View style={[styles.waveBar, s]} />;
}

function ScreenDemo({ onBack }: { onBack: () => void }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(id);
  }, []);

  const frames = [
    { app: "YouTube Kids", icon: "play", text: "Assistindo: 'Desenhos educativos'" },
    { app: "WhatsApp", icon: "chatbubble", text: "Conversa com Grupo da Família" },
    { app: "Roblox", icon: "game-controller", text: "Jogando: Adopt Me!" },
    { app: "Duolingo", icon: "school", text: "Lição: Inglês • Nível 4" },
  ];
  const current = frames[tick % frames.length];

  return (
    <View style={styles.screenWrap}>
      <View style={styles.phoneFrame}>
        <View style={styles.phoneNotch} />
        <View style={styles.phoneScreen}>
          <View style={styles.phoneStatus}>
            <Text style={styles.phoneTime}>21:42</Text>
            <View style={{ flexDirection: "row", gap: 4 }}>
              <Ionicons name="cellular" size={10} color="#FFF" />
              <Ionicons name="wifi" size={10} color="#FFF" />
              <Ionicons name="battery-half" size={10} color="#FFF" />
            </View>
          </View>
          <View style={styles.phoneContent}>
            <View style={styles.appBadge}>
              <Ionicons name={current.icon as any} size={28} color="#FFF" />
            </View>
            <Text style={styles.phoneApp}>{current.app}</Text>
            <Text style={styles.phoneText}>{current.text}</Text>
            <View style={styles.phoneLines}>
              {Array.from({ length: 5 }).map((_, i) => (
                <View key={i} style={[styles.phoneLine, { width: `${70 + (i * 5) % 25}%` }]} />
              ))}
            </View>
          </View>
          <View style={styles.phoneHome} />
        </View>
      </View>
      <Text style={styles.screenMeta}>Sincronizado há {tick * 3}s</Text>

      <View style={styles.screenControls}>
        <TouchableOpacity onPress={onBack} style={styles.audioSecBtn}>
          <Ionicons name="chevron-back" size={20} color={theme.ink} />
          <Text style={styles.audioSecText}>Voltar</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="screenshot-btn" style={styles.audioMainBtn} onPress={() => setTick(t => t + 1)}>
          <Ionicons name="camera" size={22} color="#FFF" />
          <Text style={styles.audioMainText}>Capturar tela</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  header: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: spacing.md, borderBottomWidth: 1, borderBottomColor: theme.line,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: theme.line,
    alignItems: "center", justifyContent: "center",
  },
  kicker: { fontSize: 9, letterSpacing: 2, color: theme.muted, fontWeight: "700" },
  name: { fontSize: 18, fontWeight: "800", color: theme.ink, marginTop: 2 },
  liveDot: {
    flexDirection: "row", gap: 4, alignItems: "center",
    backgroundColor: theme.ink, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill,
  },
  dotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#FFF" },
  liveText: { color: "#FFF", fontSize: 9, fontWeight: "800", letterSpacing: 1 },

  menu: { padding: spacing.lg, gap: spacing.md },
  intro: { fontSize: 13, color: theme.muted, lineHeight: 20 },
  card: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: spacing.md, borderWidth: 1, borderColor: theme.ink, borderRadius: radius.md,
  },
  cardIcon: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: theme.ink,
    alignItems: "center", justifyContent: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: theme.ink },
  cardDesc: { fontSize: 12, color: theme.muted, marginTop: 2 },
  note: {
    flexDirection: "row", gap: 8, padding: spacing.md,
    borderRadius: radius.md, backgroundColor: "#F7F7F7", alignItems: "flex-start",
  },
  noteText: { flex: 1, fontSize: 12, color: theme.muted, lineHeight: 17 },

  viewport: { flex: 1, backgroundColor: "#000", position: "relative" },
  noiseBg: { ...StyleSheet.absoluteFillObject, backgroundColor: "#111" },
  noiseLine: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "#FFF" },
  camFallbackInner: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  camFallbackText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  camFallbackSub: { color: "rgba(255,255,255,0.5)", fontSize: 12 },
  camControls: {
    position: "absolute", bottom: 40, left: 0, right: 0,
    flexDirection: "row", justifyContent: "space-around", alignItems: "center",
  },
  camBtn: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  recBtn: {
    width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: "#FFF",
    alignItems: "center", justifyContent: "center",
  },
  recBtnOn: {},
  recInner: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#FFF" },
  recInnerOn: { width: 28, height: 28, borderRadius: 6, backgroundColor: "#FFF" },
  recBadge: {
    position: "absolute", top: 20, left: 20, flexDirection: "row",
    gap: 6, alignItems: "center", backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill,
  },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFF" },
  recText: { color: "#FFF", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  permWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: 12 },
  permTitle: { color: "#FFF", fontSize: 18, fontWeight: "700", marginTop: 12 },
  permDesc: { color: "rgba(255,255,255,0.6)", fontSize: 13, textAlign: "center" },
  permBtn: {
    backgroundColor: "#FFF", paddingVertical: 12, paddingHorizontal: 28, borderRadius: radius.pill,
    marginTop: 12,
  },
  permBtnText: { color: "#000", fontSize: 14, fontWeight: "700" },
  linkBack: { color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 12, textDecorationLine: "underline" },

  audioWrap: { flex: 1, padding: spacing.lg, gap: spacing.lg },
  audioCenter: { alignItems: "center", gap: 8, marginTop: spacing.xl },
  ringsWrap: { width: 140, height: 140, alignItems: "center", justifyContent: "center" },
  ring: {
    position: "absolute", width: 120, height: 120, borderRadius: 60,
    borderWidth: 2, borderColor: theme.ink,
  },
  ringCore: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: theme.ink,
    alignItems: "center", justifyContent: "center",
  },
  audioTime: { fontSize: 32, fontWeight: "800", color: theme.ink, letterSpacing: -1, marginTop: 8 },
  audioStatus: { fontSize: 13, color: theme.muted },
  wave: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    height: 80, paddingHorizontal: spacing.sm,
  },
  waveBar: { width: 3, backgroundColor: theme.ink, borderRadius: 2, minHeight: 4 },
  audioControls: { flexDirection: "row", gap: 10, marginTop: "auto" },
  audioSecBtn: {
    flexDirection: "row", gap: 4, alignItems: "center",
    paddingVertical: 14, paddingHorizontal: 18, borderRadius: radius.pill,
    borderWidth: 1, borderColor: theme.line,
  },
  audioSecText: { color: theme.ink, fontSize: 13, fontWeight: "700" },
  audioMainBtn: {
    flex: 1, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center",
    paddingVertical: 14, borderRadius: radius.pill, backgroundColor: theme.ink,
  },
  audioStopBtn: { backgroundColor: "#333" },
  audioMainText: { color: "#FFF", fontSize: 14, fontWeight: "700" },

  screenWrap: { flex: 1, alignItems: "center", padding: spacing.lg, gap: spacing.md },
  phoneFrame: {
    width: 220, height: 440, borderRadius: 32, borderWidth: 8, borderColor: theme.ink,
    backgroundColor: theme.ink, overflow: "hidden", marginTop: spacing.md,
  },
  phoneNotch: {
    position: "absolute", top: 8, left: "50%", marginLeft: -30,
    width: 60, height: 18, borderRadius: 9, backgroundColor: "#000", zIndex: 2,
  },
  phoneScreen: { flex: 1, backgroundColor: "#1A1A1A", borderRadius: 24, padding: 10, gap: 16 },
  phoneStatus: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 10, paddingTop: 4,
  },
  phoneTime: { color: "#FFF", fontSize: 10, fontWeight: "700" },
  phoneContent: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 12 },
  appBadge: {
    width: 56, height: 56, borderRadius: 14, backgroundColor: "#333",
    alignItems: "center", justifyContent: "center",
  },
  phoneApp: { color: "#FFF", fontSize: 14, fontWeight: "700" },
  phoneText: { color: "rgba(255,255,255,0.6)", fontSize: 11, textAlign: "center" },
  phoneLines: { width: "100%", gap: 6, marginTop: 14, alignItems: "center" },
  phoneLine: { height: 6, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 3 },
  phoneHome: {
    alignSelf: "center", width: 40, height: 3, backgroundColor: "#FFF",
    opacity: 0.3, borderRadius: 2, marginBottom: 4,
  },
  screenMeta: { fontSize: 11, color: theme.muted, letterSpacing: 1, textTransform: "uppercase" },
  screenControls: { flexDirection: "row", gap: 10, width: "100%", marginTop: "auto" },
});
