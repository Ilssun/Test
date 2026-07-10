import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from "react-native";
import {
  addCategory,
  removeCategory,
  bulkImportCategories,
  addAccount,
  removeAccount,
  CategoryType,
} from "@carnet/core";
import { Eyebrow, Input, Button, Chip } from "../components/ui";
import { colors } from "../theme";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { Picker } from "@react-native-picker/picker";

export default function AdminScreen() {
  const { me } = useAuth();
  const { categories, accounts, refreshCategories, refreshAccounts } = useData();
  const notify = useToast();

  const [catName, setCatName] = useState("");
  const [catType, setCatType] = useState<CategoryType>("expense");
  const [catDesc, setCatDesc] = useState("");
  const [bulk, setBulk] = useState("");
  const [accName, setAccName] = useState("");
  const [accDesc, setAccDesc] = useState("");

  if (!me || me.role !== "admin") return null;

  const handleAddCategory = async () => {
    try {
      await addCategory(catName, catType, catDesc, categories);
      setCatName("");
      setCatDesc("");
      await refreshCategories();
      notify("Catégorie ajoutée");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Échec", "err");
    }
  };

  const handleBulkImport = async () => {
    const lines = bulk.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return notify("Colle au moins une ligne", "err");
    const n = await bulkImportCategories(lines, categories);
    if (n === 0) return notify("Rien à importer : catégories déjà présentes", "err");
    setBulk("");
    await refreshCategories();
    notify(`${n} catégorie${n > 1 ? "s" : ""} importée${n > 1 ? "s" : ""}`);
  };

  const handleRemoveCategory = (id: string, name: string) => {
    Alert.alert(`Supprimer « ${name} » ?`, undefined, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          await removeCategory(id);
          await refreshCategories();
          notify("Catégorie supprimée");
        },
      },
    ]);
  };

  const handleAddAccount = async () => {
    try {
      await addAccount(accName, accDesc, accounts);
      setAccName("");
      setAccDesc("");
      await refreshAccounts();
      notify("Compte ajouté");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Échec", "err");
    }
  };

  const handleRemoveAccount = (id: string, name: string) => {
    Alert.alert(`Supprimer « ${name} » ?`, undefined, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          await removeAccount(id);
          await refreshAccounts();
          notify("Compte supprimé");
        },
      },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.paper }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={{ marginBottom: 28 }}>
        <Eyebrow>Catégories</Eyebrow>
        {categories.length === 0 ? (
          <Text style={styles.empty}>Aucune catégorie pour l'instant.</Text>
        ) : (
          categories.map((c) => (
            <View key={c.id} style={styles.row}>
              <Text style={[styles.name, { flex: 1 }]}>{c.name}</Text>
              <Chip label={c.type === "income" ? "Revenu" : "Dépense"} tone={c.type} />
              <TouchableOpacity onPress={() => handleRemoveCategory(c.id, c.name)}>
                <Text style={styles.linkDanger}>Suppr.</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <View style={{ marginTop: 12, gap: 8 }}>
          <Input placeholder="Nom de la catégorie (ex : Courses)" value={catName} onChangeText={setCatName} />
          <View style={styles.pickerWrap}>
            <Picker selectedValue={catType} onValueChange={(v) => setCatType(v as CategoryType)}>
              <Picker.Item label="Dépense" value="expense" />
              <Picker.Item label="Revenu" value="income" />
            </Picker>
          </View>
          <Input placeholder="Description (optionnelle)" value={catDesc} onChangeText={setCatDesc} />
          <Button title="Ajouter la catégorie" onPress={handleAddCategory} />
        </View>
      </View>

      <View style={{ marginBottom: 28 }}>
        <Eyebrow>Import en masse (catégories)</Eyebrow>
        <Text style={styles.help}>Une catégorie par ligne : Nom | revenu ou depense | description (optionnelle)</Text>
        <Input
          placeholder={"Courses | depense | Alimentation\nSalaire | revenu\nLoyer | depense | Appartement"}
          value={bulk}
          onChangeText={setBulk}
          multiline
          numberOfLines={4}
          style={{ marginTop: 8 }}
        />
        <View style={{ height: 8 }} />
        <Button title="Importer la liste" onPress={handleBulkImport} />
      </View>

      <View>
        <Eyebrow>Comptes</Eyebrow>
        {accounts.length === 0 ? (
          <Text style={styles.empty}>Aucun compte pour l'instant (ex : Compte courant, Espèces).</Text>
        ) : (
          accounts.map((a) => (
            <View key={a.id} style={styles.row}>
              <Text style={[styles.name, { flex: 1 }]}>{a.name}</Text>
              <TouchableOpacity onPress={() => handleRemoveAccount(a.id, a.name)}>
                <Text style={styles.linkDanger}>Suppr.</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
        <View style={{ marginTop: 12, gap: 8 }}>
          <Input placeholder="Nom du compte (ex : Compte courant)" value={accName} onChangeText={setAccName} />
          <Input placeholder="Description (optionnelle)" value={accDesc} onChangeText={setAccDesc} />
          <Button title="Ajouter le compte" onPress={handleAddAccount} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  name: { fontWeight: "700", fontSize: 14.5, color: colors.text },
  empty: { color: colors.muted, fontSize: 14 },
  help: { color: colors.muted, fontSize: 13, marginTop: 6 },
  linkDanger: { color: colors.red, fontWeight: "700", fontSize: 13 },
  pickerWrap: { borderWidth: 2, borderColor: colors.blue, borderRadius: 8, backgroundColor: colors.field },
});
