import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { api, formatMinutes } from "../../src/api";
import { theme, spacing, radius } from "../../src/theme";
import { useChildren } from "../../src/ChildContext";
import ChildSwitcher from "../../src/components/ChildSwitcher";

export default function Dashboard() {
  const { selected } = useChildren();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const d = await api.dashboard(selected.id);
      setData(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (!selected || (loading && !data)) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <View style={styles.center}>
          <ActivityIndicator color={theme.ink} />
        </View>
      </SafeAreaView>
    );
  }

  const st = data?.screen_time;
  const pct = st ? Math.min(100, Math.round((st.today_minutes / st.limit_minutes) * 100)) : 0;

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.ink} />}
        testID="dashboard-scroll"
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.hello}>Olá 👋</Text>
            <Text style={styles.title}>Painel</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} testID="refresh-btn" onPress={load}>
            <Ionicons name="refresh" size={18} color={theme.ink} />
          </TouchableOpacity>
        </View>

        <ChildSwitcher />

        {/* Live Monitoring CTA */}
        <TouchableOpacity
          testID="live-monitoring-btn"
          activeOpacity={0.85}
          onPress={() => router.push({ pathname: "/live", params: { name: selected.name } })}
          style={styles.liveCta}
        >
          <View style={styles.liveIcon}>
            <Ionicons name="radio" size={20} color="#FFF" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.liveRow}>
              <Text style={styles.liveTitle}>Monitoramento ao vivo</Text>
              <View style={styles.liveBadge}>
                <View style={styles.liveBadgeDot} />
                <Text style={styles.liveBadgeText}>AO VIVO</Text>
              </View>
            </View>
            <Text style={styles.liveDesc}>Câmera, áudio e espelhamento de tela</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#FFF" />
        </TouchableOpacity>

        {/* Status card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>
              {selected.online ? "Dispositivo online" : "Offline"} • {selected.device}
            </Text>
          </View>
          <View style={styles.batteryRow}>
            <Ionicons name="battery-half-outline" size={14} color={theme.muted} />
            <Text style={styles.batteryText}>{selected.battery}% bateria</Text>
          </View>
        </View>

        {/* Screen time */}
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardKicker}>TEMPO DE TELA HOJE</Text>
            <Text style={styles.cardPct}>{pct}%</Text>
          </View>
          <Text style={styles.bigNum} testID="screen-time-today">
            {formatMinutes(st?.today_minutes || 0)}
          </Text>
          <Text style={styles.cardSub}>de {formatMinutes(st?.limit_minutes || 0)} permitidos</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${pct}%` }]} />
          </View>
        </View>

        {/* Location preview */}
        {data?.last_location && (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardKicker}>ÚLTIMA LOCALIZAÇÃO</Text>
              <Ionicons name="location" size={16} color={theme.ink} />
            </View>
            <Text style={styles.placeName} testID="last-location">{data.last_location.place}</Text>
            <Text style={styles.cardSub}>
              {data.last_location.latitude.toFixed(4)}, {data.last_location.longitude.toFixed(4)}
            </Text>
          </View>
        )}

        {/* Quick stats */}
        <View style={styles.statGrid}>
          <View style={styles.statBox}>
            <Ionicons name="apps" size={18} color={theme.ink} />
            <Text style={styles.statVal}>{data?.apps_count || 0}</Text>
            <Text style={styles.statLbl}>Apps hoje</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="lock-closed" size={18} color={theme.ink} />
            <Text style={styles.statVal}>{data?.blocked_count || 0}</Text>
            <Text style={styles.statLbl}>Bloqueados</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="notifications" size={18} color={theme.ink} />
            <Text style={styles.statVal}>{data?.unread_alerts || 0}</Text>
            <Text style={styles.statLbl}>Alertas</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardKicker}>ESTA SEMANA</Text>
          <View style={styles.weekBars}>
            {(st?.week || []).map((m: number, i: number) => {
              const h = Math.max(4, Math.min(100, (m / 300) * 100));
              const days = ["S", "T", "Q", "Q", "S", "S", "D"];
              return (
                <View key={i} style={styles.weekCol}>
                  <View style={styles.weekTrack}>
                    <View style={[styles.weekFill, { height: `${h}%` }]} />
                  </View>
                  <Text style={styles.weekLabel}>{days[i]}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  hello: { fontSize: 13, color: theme.muted },
  title: { fontSize: 32, fontWeight: "800", color: theme.ink, letterSpacing: -1 },
  iconBtn: {
    width: 40, height: 40, borderRadius: radius.pill, borderWidth: 1,
    borderColor: theme.line, alignItems: "center", justifyContent: "center",
  },
  statusCard: {
    borderWidth: 1, borderColor: theme.line, borderRadius: radius.md,
    padding: spacing.md, flexDirection: "row", justifyContent: "space-between",
    alignItems: "center",
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.ink },
  statusText: { fontSize: 13, color: theme.ink, fontWeight: "600" },
  batteryRow: { flexDirection: "row", gap: 4, alignItems: "center" },
  batteryText: { fontSize: 12, color: theme.muted },
  card: {
    borderWidth: 1, borderColor: theme.line, borderRadius: radius.md,
    padding: spacing.md, gap: 6,
  },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardKicker: { fontSize: 10, letterSpacing: 2, color: theme.muted, fontWeight: "700" },
  cardPct: { fontSize: 12, fontWeight: "700", color: theme.ink },
  bigNum: { fontSize: 36, fontWeight: "800", color: theme.ink, letterSpacing: -1 },
  cardSub: { fontSize: 13, color: theme.muted },
  barTrack: { height: 6, backgroundColor: theme.line, borderRadius: 3, marginTop: 6, overflow: "hidden" },
  barFill: { height: "100%", backgroundColor: theme.ink },
  placeName: { fontSize: 20, fontWeight: "700", color: theme.ink, marginTop: 2 },
  statGrid: { flexDirection: "row", gap: spacing.sm },
  statBox: {
    flex: 1, borderWidth: 1, borderColor: theme.line, borderRadius: radius.md,
    padding: spacing.md, gap: 4, alignItems: "flex-start",
  },
  statVal: { fontSize: 24, fontWeight: "800", color: theme.ink, marginTop: 4 },
  statLbl: { fontSize: 11, color: theme.muted, textTransform: "uppercase", letterSpacing: 1 },
  weekBars: { flexDirection: "row", gap: 8, height: 100, marginTop: spacing.sm, alignItems: "flex-end" },
  weekCol: { flex: 1, alignItems: "center", gap: 6, height: "100%" },
  weekTrack: { flex: 1, width: "100%", backgroundColor: "#F1F1F1", borderRadius: 4, justifyContent: "flex-end", overflow: "hidden" },
  weekFill: { backgroundColor: theme.ink, width: "100%", borderRadius: 4 },
  weekLabel: { fontSize: 10, color: theme.muted, fontWeight: "600" },
  liveCta: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: spacing.md, borderRadius: radius.md, backgroundColor: theme.ink,
  },
  liveIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  liveTitle: { color: "#FFF", fontSize: 15, fontWeight: "700", flex: 1 },
  liveBadge: {
    flexDirection: "row", gap: 4, alignItems: "center",
    backgroundColor: "#FFF", paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.pill,
  },
  liveBadgeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: theme.ink },
  liveBadgeText: { color: theme.ink, fontSize: 8, fontWeight: "800", letterSpacing: 1 },
  liveDesc: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 },
});
