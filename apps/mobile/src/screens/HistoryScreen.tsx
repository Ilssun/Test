import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { fmtDate, fmtAmount, visibleTransactions, totals, byCategory, groupByDate, leaderboard, favoriteCategory } from "@carnet/core";
import { Eyebrow, Avatar, Chip, Tally } from "../components/ui";
import { colors } from "../theme";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

export default function HistoryScreen() {
  const { me } = useAuth();
  const { transactions, users, groups } = useData();
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const isAdmin = me?.role === "admin";

  const visible = useMemo(() => {
    if (!me) return [];
    const target = isAdmin ? (groupFilter === "all" ? null : groupFilter) : null;
    return visibleTransactions(transactions, users, me, target);
  }, [transactions, users, me, isAdmin, groupFilter]);

  const filtered = useMemo(
    () =>
      visible.filter(
        (t) => (userFilter === "all" || t.userId === userFilter) && (categoryFilter === "all" || t.categoryName === categoryFilter)
      ),
    [visible, userFilter, categoryFilter]
  );

  const stats = useMemo(() => totals(filtered), [filtered]);
  const cats = useMemo(() => byCategory(filtered), [filtered]);
  const grouped = useMemo(() => groupByDate(filtered), [filtered]);
  const board = useMemo(() => leaderboard(filtered), [filtered]);
  const favCategory = useMemo(() => favoriteCategory(filtered), [filtered]);

  const memberNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of visible) map.set(t.userId, t.userName);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [visible]);

  const categoryNames = useMemo(() => [...new Set(visible.map((t) => t.categoryName))].sort(), [visible]);

  if (!me) return null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.paper }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={styles.statsRow}>
        <StatBox label="Revenus" value={fmtAmount(stats.income)} tone={colors.income} />
        <StatBox label="Dépenses" value={fmtAmount(stats.expense)} tone={colors.red} />
        <StatBox label="Solde" value={fmtAmount(stats.balance)} tone={stats.balance >= 0 ? colors.income : colors.red} />
      </View>

      <View style={[styles.statsRow, { marginTop: 8 }]}>
        <StatBox label="Écritures" value={String(filtered.length)} tone={colors.text} />
        <StatBox label="Membres actifs" value={String(board.length)} tone={colors.text} />
        <StatBox label="Catégorie favorite" value={favCategory} tone={colors.text} small />
      </View>

      {board.length > 0 && (
        <View style={{ marginTop: 24 }}>
          <Eyebrow>Le décompte</Eyebrow>
          {board.map((u, i) => (
            <View key={u.name} style={styles.boardRow}>
              <Text style={styles.boardRank}>{i === 0 ? "🏆" : i + 1}</Text>
              <Text style={styles.boardName}>{u.name}</Text>
              <View style={{ flex: 1 }}>
                <Tally count={u.count} />
              </View>
              <Text style={styles.boardCount}>{u.count}</Text>
            </View>
          ))}
        </View>
      )}

      {cats.length > 0 && (
        <View style={{ marginTop: 24 }}>
          <Eyebrow>Répartition par catégorie</Eyebrow>
          {cats.map((c) => {
            const net = c.income - c.expense;
            const max = Math.max(...cats.map((x) => Math.abs(x.income - x.expense)), 1);
            const width = Math.max(6, (Math.abs(net) / max) * 100);
            return (
              <View key={c.name} style={styles.catRow}>
                <Text style={styles.catName}>{c.name}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${width}%`, backgroundColor: net >= 0 ? colors.income : colors.red }]} />
                </View>
                <Text style={[styles.catAmount, { color: net >= 0 ? colors.income : colors.red }]}>{fmtAmount(net)}</Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={{ marginTop: 24 }}>
        <Eyebrow>Filtres</Eyebrow>
        {isAdmin && (
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={groupFilter}
              onValueChange={(v) => {
                setGroupFilter(v);
                setUserFilter("all");
              }}
            >
              <Picker.Item label="Tous les groupes" value="all" />
              {groups.map((g) => (
                <Picker.Item key={g.id} label={g.name} value={g.id} />
              ))}
              <Picker.Item label="Sans groupe" value="" />
            </Picker>
          </View>
        )}
        <View style={[styles.pickerWrap, { marginTop: 8 }]}>
          <Picker selectedValue={userFilter} onValueChange={setUserFilter}>
            <Picker.Item label="Tout le monde" value="all" />
            {memberNames.map(([id, name]) => (
              <Picker.Item key={id} label={name} value={id} />
            ))}
          </Picker>
        </View>
        <View style={[styles.pickerWrap, { marginTop: 8 }]}>
          <Picker selectedValue={categoryFilter} onValueChange={setCategoryFilter}>
            <Picker.Item label="Toutes les catégories" value="all" />
            {categoryNames.map((n) => (
              <Picker.Item key={n} label={n} value={n} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={{ marginTop: 24 }}>
        {grouped.length === 0 ? (
          <Text style={{ color: colors.muted, fontSize: 14.5 }}>
            {visible.length === 0 ? "Le carnet est vide pour l'instant." : "Aucune écriture ne correspond à ces filtres."}
          </Text>
        ) : (
          grouped.map(([date, txs]) => (
            <View key={date} style={{ marginBottom: 20 }}>
              <View style={styles.stamp}>
                <Text style={styles.stampText}>{fmtDate(date)}</Text>
              </View>
              {txs.map((t) => (
                <View key={t.id} style={styles.txRow}>
                  <Avatar name={t.userName} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <Text style={styles.txUser}>{t.userName}</Text>
                      <Chip label={t.categoryName} tone={t.type === "income" ? "income" : "expense"} />
                      <Chip label={t.accountName} />
                    </View>
                    {t.note ? <Text style={styles.txNote}>« {t.note} »</Text> : null}
                  </View>
                  <Text style={[styles.txAmount, { color: t.type === "income" ? colors.income : colors.red }]}>
                    {t.type === "income" ? "+" : "-"}
                    {fmtAmount(t.amount)}
                  </Text>
                </View>
              ))}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const StatBox = ({ label, value, tone, small }: { label: string; value: string; tone: string; small?: boolean }) => (
  <View style={styles.statBox}>
    <Text style={[styles.statValue, { color: tone }, small && { fontSize: 13 }]} numberOfLines={2}>
      {value}
    </Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  statsRow: { flexDirection: "row", gap: 8 },
  statBox: { flex: 1, borderWidth: 2, borderColor: colors.line, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  statValue: { fontSize: 16, fontWeight: "700" },
  statLabel: { fontSize: 10, color: colors.muted, textTransform: "uppercase", marginTop: 4, letterSpacing: 0.5 },
  catRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  catName: { width: 100, fontSize: 13, fontWeight: "600", color: colors.text },
  barTrack: { flex: 1, height: 8, backgroundColor: colors.line, borderRadius: 4, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 4 },
  catAmount: { fontSize: 12.5, fontWeight: "700", width: 80, textAlign: "right" },
  boardRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  boardRank: { width: 22, textAlign: "center", fontSize: 13, color: colors.muted },
  boardName: { fontWeight: "700", fontSize: 14.5, color: colors.text, minWidth: 80 },
  boardCount: { fontSize: 13, fontWeight: "700", color: colors.blue },
  pickerWrap: { borderWidth: 2, borderColor: colors.blue, borderRadius: 8, backgroundColor: colors.field },
  stamp: {
    alignSelf: "flex-start",
    borderWidth: 2,
    borderColor: colors.red,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  stampText: { color: colors.red, fontSize: 12, fontWeight: "600" },
  txRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  txUser: { fontWeight: "700", fontSize: 14.5, color: colors.text },
  txNote: { fontSize: 13, color: colors.muted, fontStyle: "italic", marginTop: 2 },
  txAmount: { fontWeight: "700", fontSize: 14 },
});
