import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { fmtDate, visibleLogEntries, leaderboard, favoriteSession, groupByDate } from "@carnet/core";
import { Eyebrow, Avatar, Chip, Stars, DateStamp, Tally } from "../components/ui";
import { colors, fonts } from "../theme";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

export default function HistoryScreen() {
  const { me } = useAuth();
  const { logEntries, users, groups } = useData();
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [sessionFilter, setSessionFilter] = useState<string>("all");

  const isAdmin = me?.role === "admin";

  const visible = useMemo(() => {
    if (!me) return [];
    const target = isAdmin ? (groupFilter === "all" ? null : groupFilter) : null;
    return visibleLogEntries(logEntries, users, me, target);
  }, [logEntries, users, me, isAdmin, groupFilter]);

  const filtered = useMemo(
    () =>
      visible.filter(
        (e) => (userFilter === "all" || e.userId === userFilter) && (sessionFilter === "all" || e.sessionName === sessionFilter)
      ),
    [visible, userFilter, sessionFilter]
  );

  const board = useMemo(() => leaderboard(filtered), [filtered]);
  const favSession = useMemo(() => favoriteSession(filtered), [filtered]);
  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const memberNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of visible) map.set(e.userId, e.userName);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [visible]);

  const sessionNames = useMemo(() => [...new Set(visible.map((e) => e.sessionName))].sort(), [visible]);

  if (!me) return null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.paper }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={styles.statsRow}>
        <StatBox label="Séances validées" value={String(filtered.length)} />
        <StatBox label="Athlètes actifs" value={String(board.length)} />
        <StatBox label="Séance favorite" value={favSession} small />
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
          <Picker selectedValue={sessionFilter} onValueChange={setSessionFilter}>
            <Picker.Item label="Toutes les séances" value="all" />
            {sessionNames.map((n) => (
              <Picker.Item key={n} label={n} value={n} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={{ marginTop: 24 }}>
        {grouped.length === 0 ? (
          <Text style={{ fontFamily: fonts.body, color: colors.muted, fontSize: 14.5 }}>
            {visible.length === 0 ? "Le carnet est vide. Valide ta première séance dans l'onglet Ma séance." : "Aucune séance ne correspond à ces filtres."}
          </Text>
        ) : (
          grouped.map(([date, entries], gi) => (
            <View key={date} style={{ marginBottom: 20 }}>
              <DateStamp tilt={gi % 2 === 0 ? -2 : 1.5}>{fmtDate(date)}</DateStamp>
              <View style={{ marginTop: 8 }}>
                {entries.map((e) => (
                  <View key={e.id} style={styles.entryRow}>
                    <Avatar name={e.userName} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <Text style={styles.entryUser}>{e.userName}</Text>
                        <Chip label={e.sessionName} />
                        {e.rating ? <Stars r={e.rating} /> : null}
                      </View>
                      {e.comment ? <Text style={styles.entryNote}>« {e.comment} »</Text> : null}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const StatBox = ({ label, value, small }: { label: string; value: string; small?: boolean }) => (
  <View style={styles.statBox}>
    <Text style={[styles.statValue, small && { fontSize: 15 }]} numberOfLines={2}>
      {value}
    </Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  statsRow: { flexDirection: "row", gap: 8 },
  statBox: { flex: 1, borderWidth: 2, borderColor: colors.line, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  statValue: { fontFamily: fonts.mono, fontSize: 22, color: colors.text, textAlign: "center" },
  statLabel: { fontFamily: fonts.mono, fontSize: 10, color: colors.muted, textTransform: "uppercase", marginTop: 4, letterSpacing: 0.5 },
  pickerWrap: { borderWidth: 2, borderColor: colors.blue, borderRadius: 8, backgroundColor: colors.field },
  boardRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  boardRank: { width: 22, textAlign: "center", fontFamily: fonts.mono, fontSize: 13, color: colors.muted },
  boardName: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.text, minWidth: 90 },
  boardCount: { fontFamily: fonts.mono, fontSize: 13, color: colors.blue },
  entryRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  entryUser: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.text },
  entryNote: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, fontStyle: "italic", marginTop: 3 },
});
