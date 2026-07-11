import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Linking } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { addTransaction, deleteTransaction, todayStr, fmtDate, fmtAmount, CategoryType, Transaction, Category } from "@carnet/core";
import { Input, Button, Eyebrow, Pill, Chip } from "../components/ui";
import { colors } from "../theme";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { Picker } from "@react-native-picker/picker";

export default function TransactionScreen() {
  const { me } = useAuth();
  const { categories, categoryGroups, accounts, transactions, refreshTransactions } = useData();
  const notify = useToast();

  const [date, setDate] = useState(todayStr());
  const [type, setType] = useState<CategoryType>("expense");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [receipt, setReceipt] = useState<{ name: string; uri: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [closedGroups, setClosedGroups] = useState<Record<string, boolean>>({});

  const filteredCategories = useMemo(() => categories.filter((c) => c.type === type), [categories, type]);

  const groupedCategories = useMemo(() => {
    const out: { id: string; name: string; list: Category[] }[] = [];
    for (const g of categoryGroups) {
      const list = filteredCategories.filter((c) => c.groupId === g.id);
      if (list.length) out.push({ id: g.id, name: g.name, list });
    }
    const rest = filteredCategories.filter((c) => !c.groupId || !categoryGroups.some((g) => g.id === c.groupId));
    if (rest.length) out.push({ id: "_none", name: "Autres catégories", list: rest });
    return out;
  }, [filteredCategories, categoryGroups]);

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const myRecent = useMemo(
    () => (me ? transactions.filter((t) => t.userId === me.id).slice(0, 8) : []),
    [transactions, me]
  );

  const pickReceipt = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/*"] });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    if ((a.size || 0) > 3 * 1024 * 1024) return notify("Fichier trop lourd (3 Mo max)", "err");
    setReceipt({ name: a.name, uri: a.uri });
  };

  const renderPill = (c: Category) => (
    <Pill
      key={c.id}
      label={c.document ? `${c.name} 📎` : c.name}
      sub={c.desc}
      selected={categoryId === c.id}
      onPress={() => setCategoryId(categoryId === c.id ? "" : c.id)}
    />
  );

  const handleSave = async () => {
    if (!me) return;
    const cat = categories.find((c) => c.id === categoryId);
    const acc = accounts.find((a) => a.id === accountId);
    if (!cat) return notify("Choisis une catégorie", "err");
    if (!acc) return notify("Choisis un compte", "err");
    const value = parseFloat(amount.replace(",", "."));
    if (!(value > 0)) return notify("Indique un montant valide", "err");

    setSaving(true);
    try {
      await addTransaction({
        date,
        type,
        categoryId: cat.id,
        categoryName: cat.name,
        accountId: acc.id,
        accountName: acc.name,
        amount: value,
        note,
        userId: me.id,
        userName: me.username,
        groupId: me.groupId || "",
        file: receipt,
      });
      await refreshTransactions();
      setCategoryId("");
      setAmount("");
      setNote("");
      setReceipt(null);
      notify("Écriture enregistrée");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Échec de l'enregistrement", "err");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (tx: Transaction) => {
    Alert.alert("Retirer cette écriture ?", tx.categoryName, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Retirer",
        style: "destructive",
        onPress: async () => {
          await deleteTransaction(tx);
          await refreshTransactions();
          notify("Écriture retirée");
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Eyebrow>Type</Eyebrow>
      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[styles.typeBtn, type === "expense" && { backgroundColor: colors.red, borderColor: colors.red }]}
          onPress={() => {
            setType("expense");
            setCategoryId("");
          }}
        >
          <Text style={[styles.typeBtnText, type === "expense" && { color: "#fff" }]}>Dépense</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, type === "income" && { backgroundColor: colors.income, borderColor: colors.income }]}
          onPress={() => {
            setType("income");
            setCategoryId("");
          }}
        >
          <Text style={[styles.typeBtnText, type === "income" && { color: "#fff" }]}>Revenu</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 20 }} />
      <Eyebrow>Date</Eyebrow>
      <Input value={date} onChangeText={setDate} placeholder="AAAA-MM-JJ" />

      <View style={{ height: 20 }} />
      <Eyebrow>Catégorie</Eyebrow>
      {filteredCategories.length === 0 ? (
        <Text style={styles.empty}>Aucune catégorie de ce type. L'admin peut en ajouter dans l'onglet Admin.</Text>
      ) : categoryGroups.length === 0 ? (
        filteredCategories.map(renderPill)
      ) : (
        groupedCategories.map((g) => (
          <View key={g.id} style={{ marginBottom: 8 }}>
            <TouchableOpacity
              style={styles.groupHeader}
              onPress={() => setClosedGroups((p) => ({ ...p, [g.id]: !p[g.id] }))}
            >
              <Text style={styles.groupHeaderText}>{closedGroups[g.id] ? "▸" : "▾"} {g.name}</Text>
              <Text style={styles.groupCount}>{g.list.length}</Text>
            </TouchableOpacity>
            {!closedGroups[g.id] && <View style={{ marginTop: 6 }}>{g.list.map(renderPill)}</View>}
          </View>
        ))
      )}

      {selectedCategory && (selectedCategory.details || selectedCategory.document) && (
        <View style={styles.progpanel}>
          <Text style={styles.progpanelTitle}>À propos — {selectedCategory.name}</Text>
          {selectedCategory.details ? <Text style={styles.progpanelText}>{selectedCategory.details}</Text> : null}
          {selectedCategory.document && (
            <Button
              title="Voir le document"
              onPress={() => Linking.openURL(selectedCategory.document!.url)}
            />
          )}
        </View>
      )}

      <View style={{ height: 12 }} />
      <Eyebrow>Compte</Eyebrow>
      {accounts.length === 0 ? (
        <Text style={styles.empty}>Aucun compte. L'admin peut en ajouter dans l'onglet Admin.</Text>
      ) : (
        <View style={styles.pickerWrap}>
          <Picker selectedValue={accountId} onValueChange={setAccountId}>
            <Picker.Item label="Choisir un compte" value="" />
            {accounts.map((a) => (
              <Picker.Item key={a.id} label={a.name} value={a.id} />
            ))}
          </Picker>
        </View>
      )}

      <View style={{ height: 20 }} />
      <Eyebrow>Montant (€)</Eyebrow>
      <Input value={amount} onChangeText={setAmount} placeholder="0,00" keyboardType="decimal-pad" />

      <View style={{ height: 20 }} />
      <Eyebrow>Note (optionnelle)</Eyebrow>
      <Input value={note} onChangeText={setNote} placeholder="Un détail sur cette écriture ?" multiline numberOfLines={2} />

      <View style={{ height: 12 }} />
      <Button
        title={receipt ? `Justificatif : ${receipt.name}` : "Joindre un justificatif"}
        onPress={pickReceipt}
      />

      <View style={{ height: 20 }} />
      <Button title={saving ? "Enregistrement…" : "Valider l'écriture"} onPress={handleSave} variant="red" disabled={saving} />

      {myRecent.length > 0 && (
        <>
          <View style={{ height: 28 }} />
          <Eyebrow>Mes dernières écritures</Eyebrow>
          {myRecent.map((t) => (
            <View key={t.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowDate}>{fmtDate(t.date)}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                  <Text style={styles.rowTitle}>{t.categoryName}</Text>
                  <Chip label={t.accountName} />
                </View>
                {t.note ? <Text style={styles.rowNote}>« {t.note} »</Text> : null}
              </View>
              <Text style={[styles.rowAmount, { color: t.type === "income" ? colors.income : colors.red }]}>
                {t.type === "income" ? "+" : "-"}
                {fmtAmount(t.amount)}
              </Text>
              <TouchableOpacity onPress={() => handleDelete(t)} style={styles.deleteBtn}>
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
  typeRow: { flexDirection: "row", gap: 8 },
  typeBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: colors.field,
  },
  typeBtnText: { fontWeight: "700", color: colors.text, textTransform: "uppercase" },
  empty: { color: colors.muted, fontSize: 14 },
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
  groupHeaderText: { fontWeight: "700", color: colors.blue, flex: 1 },
  groupCount: { fontSize: 12, fontWeight: "600", color: colors.muted },
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
  progpanelTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 1, color: colors.blue, textTransform: "uppercase" },
  progpanelText: { fontSize: 14, color: colors.text },
  pickerWrap: { borderWidth: 2, borderColor: colors.blue, borderRadius: 8, backgroundColor: colors.field },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowDate: { fontSize: 12, color: colors.muted },
  rowTitle: { fontWeight: "700", fontSize: 14.5, color: colors.text },
  rowNote: { fontSize: 13, color: colors.muted, fontStyle: "italic", marginTop: 2 },
  rowAmount: { fontWeight: "700", fontSize: 14 },
  deleteBtn: { padding: 4 },
});
