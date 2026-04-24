import { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert as RNAlert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { api } from "../../src/api";
import { theme, spacing, radius } from "../../src/theme";
import { useChildren } from "../../src/ChildContext";
import ChildSwitcher from "../../src/components/ChildSwitcher";

export default function LocationScreen() {
  const { selected } = useChildren();
  const [locations, setLocations] = useState<any[]>([]);
  const [geofences, setGeofences] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const [loc, gf] = await Promise.all([api.locations(selected.id), api.geofences(selected.id)]);
      setLocations(loc);
      setGeofences(gf);
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!selected || loading) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <View style={styles.center}><ActivityIndicator color={theme.ink} /></View>
      </SafeAreaView>
    );
  }

  const current = locations[0];

  const addGeofence = async () => {
    if (!current) return;
    RNAlert.alert("Nova geocerca", "Criar zona segura na localização atual?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Criar",
        onPress: async () => {
          await api.createGeofence({
            child_id: selected.id,
            name: `Zona ${geofences.length + 1}`,
            latitude: current.latitude,
            longitude: current.longitude,
            radius: 200,
          });
          await load();
        },
      },
    ]);
  };

  const removeGeo = async (id: string) => {
    await api.deleteGeofence(id);
    await load();
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Localização</Text>
        <ChildSwitcher />

        {/* Map mock */}
        <View style={styles.mapCard}>
          <View style={styles.mapGrid}>
            {Array.from({ length: 48 }).map((_, i) => (
              <View key={i} style={styles.mapCell} />
            ))}
          </View>
          {geofences.map((g, i) => (
            <View
              key={g.id}
              style={[
                styles.geoCircle,
                { top: 40 + i * 30, left: 60 + i * 50, width: 70, height: 70 },
              ]}
            />
          ))}
          <View style={styles.pin} testID="current-pin">
            <View style={styles.pinDot} />
            <View style={styles.pinPulse} />
          </View>
          <View style={styles.mapOverlay}>
            <Text style={styles.mapPlace}>{current?.place || "—"}</Text>
            <Text style={styles.mapCoords}>
              {current ? `${current.latitude.toFixed(4)}, ${current.longitude.toFixed(4)}` : ""}
            </Text>
          </View>
        </View>

        {/* Geofences */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.kicker}>ZONAS SEGURAS</Text>
            <TouchableOpacity testID="add-geofence-btn" onPress={addGeofence} style={styles.addBtn}>
              <Ionicons name="add" size={16} color="#FFF" />
              <Text style={styles.addText}>Nova</Text>
            </TouchableOpacity>
          </View>
          {geofences.map((g) => (
            <View key={g.id} style={styles.row} testID={`geofence-${g.id}`}>
              <View style={styles.rowIcon}>
                <Ionicons name="shield-outline" size={18} color={theme.ink} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{g.name}</Text>
                <Text style={styles.rowSub}>Raio: {g.radius}m</Text>
              </View>
              <TouchableOpacity onPress={() => removeGeo(g.id)} testID={`delete-geo-${g.id}`}>
                <Ionicons name="trash-outline" size={18} color={theme.muted} />
              </TouchableOpacity>
            </View>
          ))}
          {geofences.length === 0 && <Text style={styles.empty}>Nenhuma zona configurada</Text>}
        </View>

        {/* History */}
        <View style={styles.section}>
          <Text style={styles.kicker}>HISTÓRICO</Text>
          {locations.map((l) => (
            <View key={l.id} style={styles.row}>
              <View style={styles.timelineDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{l.place}</Text>
                <Text style={styles.rowSub}>
                  {new Date(l.timestamp).toLocaleTimeString("pt-BR", {
                    hour: "2-digit", minute: "2-digit",
                  })}
                </Text>
              </View>
            </View>
          ))}
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
  mapCard: {
    height: 280, borderRadius: radius.md, borderWidth: 1, borderColor: theme.ink,
    overflow: "hidden", position: "relative", backgroundColor: "#FAFAFA",
  },
  mapGrid: { flexDirection: "row", flexWrap: "wrap", width: "100%", height: "100%" },
  mapCell: {
    width: "16.666%", height: "16.666%",
    borderRightWidth: 0.5, borderBottomWidth: 0.5, borderColor: "#E0E0E0",
  },
  geoCircle: {
    position: "absolute", borderWidth: 1.5, borderColor: theme.ink,
    borderRadius: 999, borderStyle: "dashed", backgroundColor: "rgba(0,0,0,0.03)",
  },
  pin: {
    position: "absolute", top: "45%", left: "45%", alignItems: "center", justifyContent: "center",
  },
  pinDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: theme.ink, borderWidth: 3, borderColor: "#FFF", zIndex: 2 },
  pinPulse: { position: "absolute", width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.12)" },
  mapOverlay: {
    position: "absolute", bottom: 12, left: 12, right: 12,
    backgroundColor: "#FFF", padding: spacing.md, borderRadius: radius.sm, borderWidth: 1, borderColor: theme.line,
  },
  mapPlace: { fontSize: 16, fontWeight: "700", color: theme.ink },
  mapCoords: { fontSize: 11, color: theme.muted, marginTop: 2 },
  section: { gap: spacing.sm },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  kicker: { fontSize: 10, letterSpacing: 2, color: theme.muted, fontWeight: "700" },
  addBtn: {
    flexDirection: "row", gap: 4, backgroundColor: theme.ink,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill,
  },
  addText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.line,
  },
  rowIcon: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: theme.line, alignItems: "center", justifyContent: "center" },
  rowTitle: { fontSize: 14, fontWeight: "600", color: theme.ink },
  rowSub: { fontSize: 12, color: theme.muted, marginTop: 2 },
  timelineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.ink, marginLeft: 14 },
  empty: { color: theme.muted, fontSize: 13, paddingVertical: spacing.md, textAlign: "center" },
});
