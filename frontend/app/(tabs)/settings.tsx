import { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert as RNAlert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { api, formatMinutes } from "../../src/api";
import { theme, spacing, radius } from "../../src/theme";
import { useChildren } from "../../src/ChildContext";
import ChildSwitcher from "../../src/components/ChildSwitcher";

export default function Settings() {
  const { selected } = useChildren();
  const [st, setSt] = useState<any>(null);
  const router = useRouter();

  const load = useCallback(async () => {
    if (!selected) return;
    setSt(await api.screenTime(selected.id));
  }, [selected]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const changeLimit = (delta: number) => {
    if (!selected || !st) return;
    const next = Math.max(60, Math.min(480, st.limit_minutes + delta));
    api.setLimit(selected.id, next).then(() => setSt({ ...st, limit_minutes: next }));
  };

  const logout = () => {
    RNAlert.alert("Sair do painel", "Voltar para a tela inicial?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", onPress: () => router.replace("/") },
    ]);
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Ajustes</Text>
        <ChildSwitcher />

        {selected && (
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pName}>{selected.name}</Text>
              <Text style={styles.pMeta}>{selected.age} anos • {selected.device}</Text>
              <Text style={styles.pMeta}>Bateria: {selected.battery}%</Text>
            </View>
          </View>
        )}

        {/* Screen time limit */}
        {st && (
          <View style={styles.card}>
            <Text style={styles.kicker}>LIMITE DIÁRIO DE TELA</Text>
            <View style={styles.limitRow}>
              <TouchableOpacity
                testID="limit-minus"
                onPress={() => changeLimit(-30)}
                style={styles.stepBtn}
              >
                <Ionicons name="remove" size={20} color={theme.ink} />
              </TouchableOpacity>
              <Text style={styles.limitVal} testID="limit-value">
                {formatMinutes(st.limit_minutes)}
              </Text>
              <TouchableOpacity
                testID="limit-plus"
                onPress={() => changeLimit(30)}
                style={styles.stepBtn}
              >
                <Ionicons name="add" size={20} color={theme.ink} />
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>Ajustes em intervalos de 30 minutos</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.kicker}>PROTEÇÃO</Text>
          {[
            { icon: "shield-checkmark", t: "Filtro de conteúdo", d: "Bloqueia sites impróprios automaticamente" },
            { icon: "eye", t: "Monitoramento ao vivo", d: "Ative para ver atividades em tempo real" },
            { icon: "notifications", t: "Notificações push", d: "Receba alertas no seu dispositivo" },
            { icon: "lock-closed", t: "PIN dos pais", d: "Proteja as configurações com senha" },
          ].map((item) => (
            <TouchableOpacity key={item.t} style={styles.item} activeOpacity={0.7}>
              <View style={styles.itemIcon}>
                <Ionicons name={item.icon as any} size={18} color={theme.ink} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{item.t}</Text>
                <Text style={styles.itemDesc}>{item.d}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.muted} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.kicker}>CONTA</Text>
          {[
            { icon: "person-circle", t: "Perfis", d: "Gerenciar crianças conectadas" },
            { icon: "help-circle", t: "Suporte", d: "Central de ajuda e FAQ" },
            { icon: "document-text", t: "Privacidade", d: "Política e termos" },
          ].map((item) => (
            <TouchableOpacity key={item.t} style={styles.item} activeOpacity={0.7}>
              <View style={styles.itemIcon}>
                <Ionicons name={item.icon as any} size={18} color={theme.ink} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{item.t}</Text>
                <Text style={styles.itemDesc}>{item.d}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.muted} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity testID="logout-btn" onPress={logout} style={styles.logout}>
          <Ionicons name="log-out-outline" size={18} color={theme.ink} />
          <Text style={styles.logoutText}>Sair do painel</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>Guardião v1.0.0 • Demo</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  title: { fontSize: 32, fontWeight: "800", color: theme.ink, letterSpacing: -1 },
  profileCard: {
    flexDirection: "row", gap: spacing.md, alignItems: "center",
    padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: theme.ink,
  },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: theme.ink, alignItems: "center", justifyContent: "center" },
  pName: { fontSize: 20, fontWeight: "800", color: theme.ink },
  pMeta: { fontSize: 12, color: theme.muted, marginTop: 2 },
  card: { borderWidth: 1, borderColor: theme.line, borderRadius: radius.md, padding: spacing.md, gap: 8 },
  kicker: { fontSize: 10, letterSpacing: 2, color: theme.muted, fontWeight: "700" },
  limitRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  stepBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: theme.ink, alignItems: "center", justifyContent: "center" },
  limitVal: { fontSize: 32, fontWeight: "800", color: theme.ink, letterSpacing: -1 },
  hint: { fontSize: 11, color: theme.subtle, textAlign: "center", marginTop: 4 },
  section: { gap: 2, marginTop: spacing.sm },
  item: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.line,
  },
  itemIcon: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: theme.line, alignItems: "center", justifyContent: "center" },
  itemTitle: { fontSize: 14, fontWeight: "600", color: theme.ink },
  itemDesc: { fontSize: 12, color: theme.muted, marginTop: 2 },
  logout: {
    flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center",
    paddingVertical: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: theme.ink,
    marginTop: spacing.md,
  },
  logoutText: { color: theme.ink, fontSize: 14, fontWeight: "700" },
  footer: { textAlign: "center", color: theme.subtle, fontSize: 11, marginTop: spacing.md },
});
