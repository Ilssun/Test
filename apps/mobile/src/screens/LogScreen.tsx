import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Linking } from "react-native";
import { addLogEntry, deleteLogEntry, todayStr, fmtDate, LogEntry, Session } from "@carnet/core";
import { Input, Button, Eyebrow, Pill, Stars } from "../components/ui";
import { colors, fonts } from "../theme";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";

export default function LogScreen() {
  const { me } = useAuth();
  const { sessions, categories, logEntries, refreshLogEntries } = useData();
  const notify = useToast();

  const [date, setDate] = useState(todayStr());
  const [sessionId, setSessionId] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [closedCats, setClosedCats] = useState<Record<string, boolean>>({});

  const groupedSessions = useMemo(() => {
    const out: { id: string; name: string; list: Session[] }[] = [];
    for (const c of categories) {
      const list = sessions.filter((s) => s.catId === c.id);
      if (list.length) out.push({ id: c.id, name: c.name, list });
    }
    const rest = sessions.filter((s) => !s.catId || !categories.some((c) => c.id === s.catId));
    if (rest.length) out.push({ id: "_none", name: "Autres séances", list: rest });
    return out;
  }, [sessions, categories]);

  const selectedSession = sessions.find((s) => s.id === sessionId);

  const myRecent = useMemo(
    () => (me ? logEntries.filter((e) => e.userId === me.id).slice(0, 8) : []),
    [logEntries, me]
  );

  const renderPill = (s: Session) => (
    <Pill
      key={s.id}
      label={s.document ? `${s.name} 📎` : s.name}
      sub={s.desc}
      selected={sessionId === s.id}
      onPress={() => setSessionId(sessionId === s.id ? "" : s.id)}
    />
  );

  const handleSave = async () => {
    if (!me) return;
    const s = sessions.find((x) => x.id === sessionId);
    if (!s) return notify("Choisis une séance", "err");
    setSaving(true);
    try {
      await addLogEntry(
        {
          date,
          sessionId: s.id,
          sessionName: s.name,
          rating: rating || undefined,
          comment,
          userId: me.id,
          userName: me.username,
          groupId: me.groupId || "",
        },
        logEntries
      );
      await refreshLogEntries();
      setSessionId("");
      setRating(0);
      setComment("");
      notify("Séance validée");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Échec de l'enregistrement", "err");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (entry: LogEntry) => {
    Alert.alert("Retirer cette validation ?", entry.sessionName, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Retirer",
        style: "destructive",
        onPress: async () => {
          await deleteLogEntry(entry);
          await refreshLogEntries();
          notify("Séance retirée du carnet");
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Eyebrow>Date de la séance</Eyebrow>
      <Input value={date} onChangeText={setDate} placeholder="AAAA-MM-JJ" />

      <View style={{ height: 20 }} />
      <Eyebrow>Séance effectuée</Eyebrow>
      {sessions.length === 0 ? (
        <Text style={styles.empty}>Aucune séance au catalogue. L'admin peut en ajouter dans l'onglet Admin.</Text>
      ) : categories.length === 0 ? (
        sessions.map(renderPill)
      ) : (
        groupedSessions.map((g) => (
          <View key={g.id} style={{ marginBottom: 8 }}>
            <TouchableOpacity
              style={styles.groupHeader}
              onPress={() => setClosedCats((p) => ({ ...p, [g.id]: !p[g.id] }))}
            >
              <Text style={styles.groupHeaderText}>{closedCats[g.id] ? "▸" : "▾"} {g.name}</Text>
              <Text style={styles.groupCount}>{g.list.length}</Text>
            </TouchableOpacity>
            {!closedCats[g.id] && <View style={{ marginTop: 6 }}>{g.list.map(renderPill)}</View>}
          </View>
        ))
      )}

      {selectedSession && (selectedSession.details || selectedSession.document) && (
        <View style={styles.progpanel}>
          <Text style={styles.progpanelTitle}>Au programme — {selectedSession.name}</Text>
          {selectedSession.details ? <Text style={styles.progpanelText}>{selectedSession.details}</Text> : null}
          {selectedSession.document && (
            <Button title="Voir le document" onPress={() => Linking.openURL(selectedSession.document!.url)} />
          )}
        </View>
      )}

      <View style={{ height: 20 }} />
      <Eyebrow>Ton retour (optionnel)</Eyebrow>
      <View style={{ flexDirection: "row", gap: 2, marginBottom: 8 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <TouchableOpacity key={i} onPress={() => setRating(rating === i ? 0 : i)}>
            <Text style={[styles.star, { color: i <= rating ? colors.blue : colors.line }]}>{i <= rating ? "★" : "☆"}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Input value={comment} onChangeText={setComment} placeholder="Un commentaire sur la séance ?" multiline numberOfLines={2} />

      <View style={{ height: 20 }} />
      <Button title={saving ? "Enregistrement…" : "Valider ma séance"} onPress={handleSave} variant="red" disabled={saving || sessions.length === 0} />

      {myRecent.length > 0 && (
        <>
          <View style={{ height: 28 }} />
          <Eyebrow>Mes dernières validations</Eyebrow>
          {myRecent.map((e) => (
            <View key={e.id} style={styles.row}>
              <Text style={styles.rowDate}>{fmtDate(e.date)}</Text>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <Text style={styles.rowTitle}>{e.sessionName}</Text>
                  {e.rating ? <Stars r={e.rating} /> : null}
                </View>
                {e.comment ? <Text style={styles.rowNote}>« {e.comment} »</Text> : null}
              </View>
              <TouchableOpacity onPress={() => handleDelete(e)} style={styles.deleteBtn}>
                <Text style={{ color: colors.muted }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  empty: { fontFamily: fonts.body, color: colors.muted, fontSize: 14 },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.blue,
    borderRadius: 8,
    backgroundColor: colors.field,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  groupHeaderText: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.blue, flex: 1, textTransform: "uppercase" },
  groupCount: { fontFamily: fonts.mono, fontSize: 12, color: colors.muted },
  progpanel: {
    borderWidth: 2,
    borderColor: colors.line,
    borderStyle: "dashed",
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    backgroundColor: colors.field,
    gap: 8,
  },
  progpanelTitle: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1.5, color: colors.blue, textTransform: "uppercase" },
  progpanelText: { fontFamily: fonts.body, fontSize: 14, color: colors.text },
  star: { fontSize: 30, lineHeight: 34 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowDate: { fontFamily: fonts.mono, fontSize: 12, color: colors.muted, minWidth: 90 },
  rowTitle: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.text },
  rowNote: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, fontStyle: "italic", marginTop: 2 },
  deleteBtn: { padding: 4 },
});
