import { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { api, formatMinutes } from "../../src/api";
import { theme, spacing, radius } from "../../src/theme";
import { useChildren } from "../../src/ChildContext";
import ChildSwitcher from "../../src/components/ChildSwitcher";

export default function AppsScreen() {
  const { selected } = useChildren();
  const [apps, setApps] = useState<any[]>([]);
  const [screenTime, setScreenTime] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>("Todos");

  const load = useCallback(async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const [a, s] = await Promise.all([api.apps(selected.id), api.screenTime(selected.id)]);
      setApps(a);
      setScreenTime(s);
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggle = async (id: string, blocked: boolean) => {
    await api.toggleBlock(id, blocked);
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, blocked } : a)));
  };

  if (!selected || loading) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <View style={styles.center}><ActivityIndicator color={theme.ink} /></View>
      </SafeAreaView>
    );
  }

  const categories = ["Todos", ...Array.from(new Set(apps.map((a) => a.category)))];
  const list = filter === "Todos" ? apps : apps.filter((a) => a.category === filter);
  const sorted = [...list].sort((a, b) => b.minutes - a.minutes);
  const maxMin = Math.max(...apps.map((a) => a.minutes), 1);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Apps e Tela</Text>
        <ChildSwitcher />

        {/* Summary */}
        {screenTime && (
          <View style={styles.sumCard}>
            <Text style={styles.kicker}>USO HOJE</Text>
            <Text style={styles.bigNum}>{formatMinutes(screenTime.today_minutes)}</Text>
            <View style={styles.catRow}>
              {Object.entries(screenTime.by_category || {}).map(([cat, mins]: any) => {
                const pct = (mins / screenTime.today_minutes) * 100;
                return (
                  <View key={cat} style={[styles.catBar, { flex: pct || 1 }]}>
                    <Text style={styles.catLabel} numberOfLines={1}>{cat}</Text>
                    <Text style={styles.catVal}>{formatMinutes(mins)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {categories.map((c) => (
            <TouchableOpacity
              key={c}
              testID={`filter-${c.toLowerCase()}`}
              onPress={() => setFilter(c)}
              style={[styles.filter, filter === c && styles.filterOn]}
            >
              <Text style={[styles.filterText, filter === c && styles.filterTextOn]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Apps */}
        <View style={styles.list}>
          {sorted.map((a) => {
            const pct = (a.minutes / maxMin) * 100;
            return (
              <View key={a.id} style={styles.appRow} testID={`app-row-${a.id}`}>
                <View style={styles.appIcon}>
                  <Ionicons name={a.icon as any} size={18} color={theme.ink} />
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                  <View style={styles.appHeader}>
                    <Text style={styles.appName}>{a.app_name}</Text>
                    <Text style={styles.appTime}>{formatMinutes(a.minutes)}</Text>
                  </View>
                  <View style={styles.appBarTrack}>
                    <View style={[styles.appBarFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.appCat}>{a.category}</Text>
                </View>
                <Switch
                  testID={`block-switch-${a.id}`}
                  value={a.blocked}
                  onValueChange={(v) => toggle(a.id, v)}
                  trackColor={{ false: "#E5E5E5", true: theme.ink }}
                  thumbColor="#FFF"
                />
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  title: { fontSize: 32, fontWeight: "800", color: theme.ink, letterSpacing: -1 },
  sumCard: { borderWidth: 1, borderColor: theme.ink, borderRadius: radius.md, padding: spacing.md, gap: 8 },
  kicker: { fontSize: 10, letterSpacing: 2, color: theme.muted, fontWeight: "700" },
  bigNum: { fontSize: 40, fontWeight: "800", color: theme.ink, letterSpacing: -1 },
  catRow: { flexDirection: "row", gap: 2, marginTop: 8, height: 48, borderRadius: 6, overflow: "hidden" },
  catBar: { backgroundColor: "#F2F2F2", padding: 6, justifyContent: "center" },
  catLabel: { fontSize: 9, fontWeight: "700", color: theme.ink, textTransform: "uppercase" },
  catVal: { fontSize: 10, color: theme.muted },
  filters: { gap: 6, paddingVertical: 4 },
  filter: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: theme.line },
  filterOn: { backgroundColor: theme.ink, borderColor: theme.ink },
  filterText: { fontSize: 12, color: theme.ink, fontWeight: "600" },
  filterTextOn: { color: "#FFF" },
  list: { gap: 4 },
  appRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.line,
  },
  appIcon: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: theme.line, alignItems: "center", justifyContent: "center" },
  appHeader: { flexDirection: "row", justifyContent: "space-between" },
  appName: { fontSize: 14, fontWeight: "700", color: theme.ink },
  appTime: { fontSize: 13, color: theme.ink, fontWeight: "600" },
  appBarTrack: { height: 4, backgroundColor: "#F2F2F2", borderRadius: 2, overflow: "hidden" },
  appBarFill: { height: "100%", backgroundColor: theme.ink },
  appCat: { fontSize: 10, color: theme.muted, textTransform: "uppercase", letterSpacing: 1 },
});
