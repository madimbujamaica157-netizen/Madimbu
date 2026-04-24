import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../src/api";
import { theme, spacing, radius } from "../src/theme";

export default function Landing() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Warm up backend seeding
    api.children().finally(() => setReady(true));
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topRow}>
          <View style={styles.logoBox}>
            <Ionicons name="shield-checkmark" size={18} color="#FFF" />
          </View>
          <Text style={styles.brand} testID="brand-name">Guardião</Text>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroKicker}>CONTROLE PARENTAL</Text>
          <Text style={styles.heroTitle}>
            Proteja seus filhos.{"\n"}Sem esforço.
          </Text>
          <Text style={styles.heroSub}>
            Monitore localização, uso de apps, tempo de tela e muito mais — tudo em um só lugar.
          </Text>
        </View>

        <View style={styles.grid}>
          {[
            { i: "location", t: "Localização em\ntempo real" },
            { i: "time", t: "Tempo de tela\ninteligente" },
            { i: "lock-closed", t: "Bloquear apps\nindesejados" },
            { i: "notifications", t: "Alertas\nimediatos" },
          ].map((c) => (
            <View key={c.i} style={styles.feat}>
              <Ionicons name={c.i as any} size={22} color={theme.ink} />
              <Text style={styles.featText}>{c.t}</Text>
            </View>
          ))}
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>24/7</Text>
            <Text style={styles.statLabel}>Monitoramento</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>2</Text>
            <Text style={styles.statLabel}>Crianças</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>100%</Text>
            <Text style={styles.statLabel}>Privado</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.ctaWrap}>
        <TouchableOpacity
          testID="enter-app-btn"
          style={styles.cta}
          activeOpacity={0.85}
          disabled={!ready}
          onPress={() => router.replace("/(tabs)")}
        >
          {ready ? (
            <>
              <Text style={styles.ctaText}>Acessar painel</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </>
          ) : (
            <ActivityIndicator color="#FFF" />
          )}
        </TouchableOpacity>
        <Text style={styles.legal}>
          Demonstração • Dados simulados para fins ilustrativos
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  topRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoBox: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: theme.ink,
    alignItems: "center", justifyContent: "center",
  },
  brand: { fontSize: 20, fontWeight: "700", letterSpacing: -0.5, color: theme.ink },
  hero: { marginTop: spacing.xl },
  heroKicker: { fontSize: 11, letterSpacing: 2, color: theme.muted, marginBottom: spacing.sm },
  heroTitle: { fontSize: 44, fontWeight: "800", color: theme.ink, lineHeight: 48, letterSpacing: -1.5 },
  heroSub: { fontSize: 15, color: theme.muted, marginTop: spacing.md, lineHeight: 22 },
  grid: {
    marginTop: spacing.xl, flexDirection: "row", flexWrap: "wrap",
    gap: spacing.sm,
  },
  feat: {
    flexBasis: "48%", flexGrow: 1, borderWidth: 1, borderColor: theme.line,
    padding: spacing.md, borderRadius: radius.md, gap: 10, minHeight: 88,
  },
  featText: { fontSize: 13, color: theme.ink, fontWeight: "600", lineHeight: 17 },
  stats: {
    marginTop: spacing.xl, flexDirection: "row",
    borderWidth: 1, borderColor: theme.ink, borderRadius: radius.md,
    padding: spacing.md, alignItems: "center",
  },
  stat: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: "800", color: theme.ink },
  statLabel: { fontSize: 11, color: theme.muted, marginTop: 2, textTransform: "uppercase", letterSpacing: 1 },
  statDiv: { width: 1, height: 30, backgroundColor: theme.line },
  ctaWrap: { padding: spacing.lg, gap: spacing.sm, backgroundColor: theme.bg },
  cta: {
    flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center",
    backgroundColor: theme.ink, paddingVertical: 16, borderRadius: radius.pill,
  },
  ctaText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  legal: { textAlign: "center", color: theme.subtle, fontSize: 11 },
});
