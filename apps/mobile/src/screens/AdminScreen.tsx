import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Linking } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import {
  addCategory,
  updateCategoryDetails,
  moveCategory,
  removeCategory,
  bulkImportCategories,
  addCategoryGroup,
  renameCategoryGroup,
  removeCategoryGroup,
  addAccount,
  removeAccount,
  CategoryType,
  Category,
} from "@carnet/core";
import { Eyebrow, Input, Button, Chip } from "../components/ui";
import { colors } from "../theme";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { Picker } from "@react-native-picker/picker";

type PickedFile = { name: string; uri: string } | null;

export default function AdminScreen() {
  const { me } = useAuth();
  const {
    categories,
    categoryGroups,
    accounts,
    refreshCategories,
    refreshCategoryGroups,
    refreshAccounts,
  } = useData();
  const notify = useToast();

  const [catName, setCatName] = useState("");
  const [catType, setCatType] = useState<CategoryType>("expense");
  const [catDesc, setCatDesc] = useState("");
  const [catDetails, setCatDetails] = useState("");
  const [catGroupId, setCatGroupId] = useState("");
  const [catFile, setCatFile] = useState<PickedFile>(null);

  const [editId, setEditId] = useState<string | null>(null);
  const [editDetails, setEditDetails] = useState("");
  const [editFile, setEditFile] = useState<PickedFile | null | undefined>(undefined);

  const [newGroupName, setNewGroupName] = useState("");
  const [renameGroupId, setRenameGroupId] = useState<string | null>(null);
  const [renameGroupVal, setRenameGroupVal] = useState("");

  const [bulk, setBulk] = useState("");
  const [bulkType, setBulkType] = useState<CategoryType>("expense");
  const [bulkGroupId, setBulkGroupId] = useState("");

  const [accName, setAccName] = useState("");
  const [accDesc, setAccDesc] = useState("");

  if (!me || me.role !== "admin") return null;

  const groupName = (id: string) => categoryGroups.find((g) => g.id === id)?.name || "";

  const pickFile = async (target: "add" | "edit") => {
    const res = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/*"] });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    if ((a.size || 0) > 3 * 1024 * 1024) return notify("Fichier trop lourd (3 Mo max)", "err");
    if (target === "add") setCatFile({ name: a.name, uri: a.uri });
    else setEditFile({ name: a.name, uri: a.uri });
  };

  const handleAddCategory = async () => {
    try {
      await addCategory(
        { name: catName, type: catType, desc: catDesc, details: catDetails, groupId: catGroupId, file: catFile },
        categories
      );
      setCatName("");
      setCatDesc("");
      setCatDetails("");
      setCatFile(null);
      await refreshCategories();
      notify("Catégorie ajoutée au catalogue");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Échec", "err");
    }
  };

  const startEdit = (c: Category) => {
    setEditId(c.id);
    setEditDetails(c.details || "");
    setEditFile(undefined);
  };

  const saveEdit = async (c: Category) => {
    try {
      await updateCategoryDetails(c, editDetails, editFile);
      setEditId(null);
      await refreshCategories();
      notify("Catégorie mise à jour");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Échec", "err");
    }
  };

  const handleRemoveCategory = (c: Category) => {
    Alert.alert(`Supprimer « ${c.name} » ?`, undefined, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          await removeCategory(c);
          await refreshCategories();
          notify("Catégorie retirée du catalogue");
        },
      },
    ]);
  };

  const handleBulkImport = async () => {
    const lines = bulk.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return notify("Colle au moins une ligne", "err");
    const n = await bulkImportCategories(lines, bulkType, bulkGroupId, categories);
    if (n === 0) return notify("Rien à importer : catégories déjà présentes", "err");
    setBulk("");
    await refreshCategories();
    notify(`${n} catégorie${n > 1 ? "s" : ""} importée${n > 1 ? "s" : ""}`);
  };

  const handleAddGroup = async () => {
    try {
      await addCategoryGroup(newGroupName, categoryGroups);
      setNewGroupName("");
      await refreshCategoryGroups();
      notify("Groupe créé");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Échec", "err");
    }
  };

  const saveGroupRename = async () => {
    if (!renameGroupId) return;
    try {
      await renameCategoryGroup(renameGroupId, renameGroupVal, categoryGroups);
      setRenameGroupId(null);
      await refreshCategoryGroups();
      notify("Groupe renommé");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Échec", "err");
    }
  };

  const handleRemoveGroup = (id: string, name: string) => {
    Alert.alert(`Supprimer « ${name} » ?`, "Ses catégories redeviennent sans groupe.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          await removeCategoryGroup(id, categories);
          await refreshCategoryGroups();
          await refreshCategories();
          notify("Groupe supprimé");
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
        <Eyebrow>Catalogue des catégories</Eyebrow>
        {categories.length === 0 ? (
          <Text style={styles.empty}>Le catalogue est vide. Ajoute une première catégorie ci-dessous.</Text>
        ) : (
          categories.map((c) => (
            <View key={c.id} style={styles.catBlock}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <Text style={styles.name}>{c.name}</Text>
                    {c.document ? <Text>📎</Text> : null}
                    <Chip label={c.type === "income" ? "Revenu" : "Dépense"} tone={c.type} />
                    {groupName(c.groupId) ? <Chip label={groupName(c.groupId)} /> : null}
                  </View>
                  {c.desc ? <Text style={styles.muted}>{c.desc}</Text> : null}
                </View>
                <TouchableOpacity onPress={() => (editId === c.id ? setEditId(null) : startEdit(c))}>
                  <Text style={styles.link}>{editId === c.id ? "Fermer" : "Modifier"}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemoveCategory(c)}>
                  <Text style={styles.linkDanger}>Suppr.</Text>
                </TouchableOpacity>
              </View>
              {editId === c.id && (
                <View style={styles.editpanel}>
                  <Input
                    placeholder="Détails (optionnel)"
                    value={editDetails}
                    onChangeText={setEditDetails}
                    multiline
                    numberOfLines={3}
                  />
                  <Text style={styles.muted}>
                    Document : {editFile === null ? "sera retiré" : editFile ? editFile.name : c.document ? c.document.name : "aucun"}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                    <Button title={c.document || editFile ? "Remplacer" : "Joindre un document"} onPress={() => pickFile("edit")} />
                    {(editFile || (editFile === undefined && c.document)) && (
                      <Button title="Retirer le document" onPress={() => setEditFile(null)} variant="danger" />
                    )}
                    {c.document && !editFile && editFile !== null && (
                      <Button title="Voir le document" onPress={() => Linking.openURL(c.document!.url)} />
                    )}
                    <Button title="Enregistrer" onPress={() => saveEdit(c)} variant="red" />
                  </View>
                </View>
              )}
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
          {categoryGroups.length > 0 && (
            <View style={styles.pickerWrap}>
              <Picker selectedValue={catGroupId} onValueChange={setCatGroupId}>
                <Picker.Item label="Sans groupe" value="" />
                {categoryGroups.map((g) => (
                  <Picker.Item key={g.id} label={g.name} value={g.id} />
                ))}
              </Picker>
            </View>
          )}
          <Input placeholder="Description courte (optionnelle)" value={catDesc} onChangeText={setCatDesc} />
          <Input placeholder="Détails (optionnel)" value={catDetails} onChangeText={setCatDetails} multiline numberOfLines={2} />
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <Button title={catFile ? `Fichier : ${catFile.name}` : "Joindre un document"} onPress={() => pickFile("add")} />
          </View>
          <Button title="Ajouter au catalogue" onPress={handleAddCategory} />
          <Text style={styles.help}>Document : 3 Mo max, visible par tous les membres.</Text>
        </View>
      </View>

      <View style={{ marginBottom: 28 }}>
        <Eyebrow>Groupes de catégories</Eyebrow>
        {categoryGroups.length === 0 ? (
          <Text style={styles.empty}>Aucun groupe. Crée-en pour organiser le catalogue en sous-menus.</Text>
        ) : (
          categoryGroups.map((g) => {
            const nb = categories.filter((c) => c.groupId === g.id).length;
            return (
              <View key={g.id} style={styles.row}>
                {renameGroupId === g.id ? (
                  <>
                    <Input value={renameGroupVal} onChangeText={setRenameGroupVal} style={{ flex: 1 }} />
                    <Button title="OK" onPress={saveGroupRename} />
                    <Button title="Annuler" onPress={() => setRenameGroupId(null)} />
                  </>
                ) : (
                  <>
                    <Text style={[styles.name, { flex: 1 }]}>{g.name}</Text>
                    <Text style={styles.muted}>{nb} catégorie{nb > 1 ? "s" : ""}</Text>
                    <TouchableOpacity onPress={() => { setRenameGroupId(g.id); setRenameGroupVal(g.name); }}>
                      <Text style={styles.link}>Renommer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleRemoveGroup(g.id, g.name)}>
                      <Text style={styles.linkDanger}>Suppr.</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            );
          })
        )}
        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
          <Input placeholder="Nouveau groupe (ex : Dépenses fixes)" value={newGroupName} onChangeText={setNewGroupName} style={{ flex: 1 }} />
          <Button title="Créer" onPress={handleAddGroup} />
        </View>
      </View>

      {categoryGroups.length > 0 && categories.length > 0 && (
        <View style={{ marginBottom: 28 }}>
          <Eyebrow>Ranger les catégories</Eyebrow>
          {categories.map((c) => (
            <View key={c.id} style={styles.row}>
              <Text style={[styles.name, { flex: 1 }]}>{c.name}</Text>
              <View style={[styles.pickerWrap, { minWidth: 160 }]}>
                <Picker
                  selectedValue={c.groupId || ""}
                  onValueChange={(v) => moveCategory(c.id, v).then(refreshCategories)}
                >
                  <Picker.Item label="Sans groupe" value="" />
                  {categoryGroups.map((g) => (
                    <Picker.Item key={g.id} label={g.name} value={g.id} />
                  ))}
                </Picker>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={{ marginBottom: 28 }}>
        <Eyebrow>Import en masse (catégories)</Eyebrow>
        <Text style={styles.help}>Une catégorie par ligne : Nom | description | détails (les deux derniers optionnels)</Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
          <View style={[styles.pickerWrap, { flex: 1 }]}>
            <Picker selectedValue={bulkType} onValueChange={(v) => setBulkType(v as CategoryType)}>
              <Picker.Item label="Dépense" value="expense" />
              <Picker.Item label="Revenu" value="income" />
            </Picker>
          </View>
          {categoryGroups.length > 0 && (
            <View style={[styles.pickerWrap, { flex: 1 }]}>
              <Picker selectedValue={bulkGroupId} onValueChange={setBulkGroupId}>
                <Picker.Item label="Sans groupe" value="" />
                {categoryGroups.map((g) => (
                  <Picker.Item key={g.id} label={g.name} value={g.id} />
                ))}
              </Picker>
            </View>
          )}
        </View>
        <Input
          placeholder={"Courses | Alimentation | Supermarché + marché\nSalaire\nLoyer | Appartement"}
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
  catBlock: { borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 4 },
  name: { fontWeight: "700", fontSize: 14.5, color: colors.text },
  muted: { color: colors.muted, fontSize: 12.5 },
  empty: { color: colors.muted, fontSize: 14 },
  help: { color: colors.muted, fontSize: 13, marginTop: 6 },
  link: { color: colors.blue, fontWeight: "700", fontSize: 13 },
  linkDanger: { color: colors.red, fontWeight: "700", fontSize: 13 },
  pickerWrap: { borderWidth: 2, borderColor: colors.blue, borderRadius: 8, backgroundColor: colors.field },
  editpanel: {
    borderWidth: 2,
    borderColor: colors.line,
    borderStyle: "dashed",
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
    gap: 8,
    backgroundColor: colors.field,
  },
});
