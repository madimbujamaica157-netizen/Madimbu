import { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { api } from "../../src/api";
import { theme, spacing, radius } from "../../src/theme";
import { useChildren } from "../../src/ChildContext";
import ChildSwitcher from "../../src/components/ChildSwitcher";

const ICONS: Record<string, string> = {
  geofence: "location",
  screen_time: "time",
  app_blocked: "lock-closed",
  content: "warning",
  low_battery: "battery-dead",
};

export default function AlertsScreen() {
  const { selected } = useChildren();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"all" | "unread">("all");

  const load = useCallback(async () => {
    if (!selected) return;
    setLoading(true);
    try { setAlerts(await api.alerts(selected.id)); }
    finally { setLoading(false); }
  }, [selected]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const markRead = async (id: string) => {
    await api.markRead(id);
    setAlerts((p) => p.map((a) => (a.id === id ? { ...a, read: true } : a)));
  };

  const readAll = async () => {
    if (!selected) return;
    await api.readAll(selected.id);
    setAlerts((p) => p.map((a) => ({ ...a, read: true })));
  };

  if (!selected || loading) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <View style={styles.center}><ActivityIndicator color={theme.ink} /></View>
      </SafeAreaView>
    );
  }

  const list = tab === "unread" ? alerts.filter((a) => !a.read) : alerts;
  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Alertas</Text>
            <Text style={styles.sub}>{unreadCount} não lidos</Text>
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity testID="read-all-btn" onPress={readAll} style={styles.readAllBtn}>
              <Text style={styles.readAllText}>Marcar todos</Text>
            </TouchableOpacity>
          )}
        </View>

        <ChildSwitcher />

        <View style={styles.tabs}>
          <TouchableOpacity
            testID="tab-all"
            onPress={() => setTab("all")}
            style={[styles.tab, tab === "all" && styles.tabOn]}
          >
            <Text style={[styles.tabText, tab === "all" && styles.tabTextOn]}>Todos ({alerts.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="tab-unread"
            onPress={() => setTab("unread")}
            style={[styles.tab, tab === "unread" && styles.tabOn]}
          >
            <Text style={[styles.tabText, tab === "unread" && styles.tabTextOn]}>Não lidos ({unreadCount})</Text>
          </TouchableOpacity>
        </View>

        {list.map((a) => (
          <TouchableOpacity
            key={a.id}
            testID={`alert-${a.id}`}
            style={[styles.alert, !a.read && styles.alertUnread]}
            onPress={() => markRead(a.id)}
            activeOpacity={0.8}
          >
            <View style={[styles.alertIcon, a.severity === "danger" && styles.iconDanger]}>
              <Ionicons
                name={(ICONS[a.type] as any) || "alert-circle"}
                size={18}
                color={a.severity === "danger" ? "#FFF" : theme.ink}
              />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.alertHead}>
                <Text style={styles.alertTitle}>{a.title}</Text>
                {!a.read && <View style={styles.dot} />}
              </View>
              <Text style={styles.alertDesc}>{a.description}</Text>
              <Text style={styles.alertTime}>
                {new Date(a.timestamp).toLocaleString("pt-BR", {
                  day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                })}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {list.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={48} color={theme.subtle} />
            <Text style={styles.emptyText}>Tudo em ordem por aqui</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  title: { fontSize: 32, fontWeight: "800", color: theme.ink, letterSpacing: -1 },
  sub: { fontSize: 13, color: theme.muted, marginTop: 2 },
  readAllBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: theme.ink },
  readAllText: { fontSize: 12, fontWeight: "700", color: theme.ink },
  tabs: { flexDirection: "row", gap: 6 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: radius.pill, borderWidth: 1, borderColor: theme.line, alignItems: "center" },
  tabOn: { backgroundColor: theme.ink, borderColor: theme.ink },
  tabText: { fontSize: 12, fontWeight: "700", color: theme.ink },
  tabTextOn: { color: "#FFF" },
  alert: {
    flexDirection: "row", gap: 12, padding: spacing.md,
    borderRadius: radius.md, borderWidth: 1, borderColor: theme.line, backgroundColor: "#FFF",
  },
  alertUnread: { borderColor: theme.ink, backgroundColor: "#FAFAFA" },
  alertIcon: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: theme.ink,
    alignItems: "center", justifyContent: "center",
  },
  iconDanger: { backgroundColor: theme.ink },
  alertHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  alertTitle: { fontSize: 14, fontWeight: "700", color: theme.ink, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.ink },
  alertDesc: { fontSize: 13, color: theme.muted, marginTop: 4, lineHeight: 18 },
  alertTime: { fontSize: 11, color: theme.subtle, marginTop: 6, textTransform: "uppercase", letterSpacing: 1 },
  empty: { alignItems: "center", padding: spacing.xxl, gap: 8 },
  emptyText: { color: theme.muted, fontSize: 14 },
});
