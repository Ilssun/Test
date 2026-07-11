import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, TextInputProps, ViewStyle } from "react-native";
import { colors, radii, fonts } from "../theme";

export const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.eyebrowRow}>
    <Text style={styles.eyebrow}>{children}</Text>
    <View style={styles.eyebrowLine} />
  </View>
);

export const Section = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => (
  <View style={[{ marginBottom: 24 }, style]}>{children}</View>
);

export const Input = (props: TextInputProps) => (
  <TextInput placeholderTextColor={colors.muted} style={[styles.input, props.style]} {...props} />
);

export const Button = ({
  title,
  onPress,
  variant = "ink",
  disabled,
  icon,
}: {
  title: string;
  onPress: () => void;
  variant?: "red" | "ink" | "danger";
  disabled?: boolean;
  icon?: React.ReactNode;
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={[
      styles.btn,
      variant === "red" && styles.btnRed,
      variant === "ink" && styles.btnInk,
      variant === "danger" && styles.btnDanger,
      disabled && { opacity: 0.55 },
    ]}
  >
    {icon}
    <Text
      style={[
        styles.btnText,
        variant === "red" && { color: "#FFF6F0" },
        (variant === "ink" || variant === "danger") && { color: variant === "danger" ? colors.red : colors.blue },
      ]}
    >
      {title}
    </Text>
  </TouchableOpacity>
);

export const Avatar = ({ name }: { name: string }) => {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials || "?"}</Text>
    </View>
  );
};

export const Chip = ({ label }: { label: string }) => (
  <View style={styles.chip}>
    <Text style={styles.chipText}>{label}</Text>
  </View>
);

export const Stars = ({ r }: { r: number }) => (
  <Text style={styles.stars}>{"★".repeat(r)}{"☆".repeat(Math.max(0, 5 - r))}</Text>
);

export const DateStamp = ({ children, tilt = -2 }: { children: React.ReactNode; tilt?: number }) => (
  <View style={[styles.stamp, { transform: [{ rotate: `${tilt}deg` }] }]}>
    <Text style={styles.stampText}>{children}</Text>
  </View>
);

const TallyGroup = ({ n }: { n: number }) => {
  const bars = Math.min(n, 4);
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", width: 22, height: 16 }}>
      {Array.from({ length: bars }).map((_, i) => (
        <View key={i} style={{ width: 2, height: 14, backgroundColor: colors.blue, marginRight: 2, borderRadius: 1 }} />
      ))}
      {n >= 5 && (
        <View
          style={{
            position: "absolute",
            width: 24,
            height: 2,
            backgroundColor: colors.blue,
            top: 6,
            left: -1,
            transform: [{ rotate: "-35deg" }],
          }}
        />
      )}
    </View>
  );
};

export const Tally = ({ count }: { count: number }) => {
  const groups = Math.floor(count / 5);
  const rest = count % 5;
  const maxGroups = 6;
  const shown = Math.min(groups, maxGroups);
  const overflow = groups > maxGroups;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
      {Array.from({ length: shown }).map((_, i) => (
        <TallyGroup key={i} n={5} />
      ))}
      {!overflow && rest > 0 && <TallyGroup n={rest} />}
      {overflow && <Text style={{ fontSize: 11, color: colors.muted }}>+{count - maxGroups * 5}</Text>}
    </View>
  );
};

export const Pill = ({
  label,
  sub,
  selected,
  onPress,
}: {
  label: string;
  sub?: string;
  selected?: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity onPress={onPress} style={[styles.pill, selected && styles.pillOn]}>
    <Text style={[styles.pillTitle, selected && { color: "#fff" }]}>{label}</Text>
    {sub ? <Text style={[styles.pillSub, selected && { color: "#fff", opacity: 0.85 }]}>{sub}</Text> : null}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.blue,
  },
  eyebrowLine: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    borderStyle: "dashed",
  },
  input: {
    width: "100%",
    backgroundColor: colors.field,
    borderWidth: 2,
    borderColor: colors.blue,
    borderRadius: radii.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text,
  },
  btn: {
    borderRadius: radii.sm,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnText: { fontFamily: fonts.displayBold, fontWeight: "700", fontSize: 17, textTransform: "uppercase", letterSpacing: 0.5 },
  btnRed: { backgroundColor: colors.red, borderWidth: 2, borderColor: colors.red },
  btnInk: { backgroundColor: "transparent", borderWidth: 2, borderColor: colors.blue },
  btnDanger: { backgroundColor: "transparent", borderWidth: 2, borderColor: colors.red },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.field,
  },
  avatarText: { fontFamily: fonts.mono, fontSize: 11, color: colors.blue },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
    backgroundColor: colors.field,
  },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.blue },
  stars: { fontFamily: fonts.mono, color: colors.blue, fontSize: 13, letterSpacing: 1 },
  stamp: {
    alignSelf: "flex-start",
    borderWidth: 2,
    borderColor: colors.red,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 10,
    backgroundColor: colors.sheet,
  },
  stampText: { fontFamily: fonts.monoSemi, color: colors.red, fontSize: 12, letterSpacing: 1 },
  pill: {
    borderWidth: 2,
    borderColor: colors.blue,
    borderRadius: radii.sm,
    backgroundColor: colors.field,
    padding: 12,
    marginBottom: 8,
  },
  pillOn: { backgroundColor: colors.blue },
  pillTitle: { fontFamily: fonts.display, fontSize: 17, color: colors.text, textTransform: "uppercase" },
  pillSub: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 2 },
});
