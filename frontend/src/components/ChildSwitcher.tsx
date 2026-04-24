import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme, spacing, radius } from "../theme";
import { useChildren } from "../ChildContext";

export default function ChildSwitcher() {
  const { children, selected, setSelected } = useChildren();
  if (children.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {children.map((c) => {
        const active = selected?.id === c.id;
        return (
          <TouchableOpacity
            key={c.id}
            testID={`child-chip-${c.name.toLowerCase()}`}
            onPress={() => setSelected(c)}
            style={[styles.chip, active && styles.chipActive]}
            activeOpacity={0.8}
          >
            <View style={[styles.avatar, active && styles.avatarActive]}>
              <Ionicons name="person" size={14} color={active ? "#FFF" : theme.ink} />
            </View>
            <View>
              <Text style={[styles.name, active && styles.nameActive]}>{c.name}</Text>
              <Text style={[styles.meta, active && styles.metaActive]}>
                {c.age} anos • {c.online ? "Online" : "Offline"}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingVertical: 2 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: radius.pill, borderWidth: 1, borderColor: theme.line,
    backgroundColor: theme.bg,
  },
  chipActive: { backgroundColor: theme.ink, borderColor: theme.ink },
  avatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#EFEFEF", alignItems: "center", justifyContent: "center",
  },
  avatarActive: { backgroundColor: "rgba(255,255,255,0.15)" },
  name: { fontSize: 13, fontWeight: "700", color: theme.ink },
  nameActive: { color: "#FFF" },
  meta: { fontSize: 10, color: theme.muted },
  metaActive: { color: "rgba(255,255,255,0.7)" },
});
