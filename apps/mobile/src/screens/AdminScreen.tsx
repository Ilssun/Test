import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Linking } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import {
  addSession,
  updateSessionDetails,
  moveSession,
  removeSession,
  bulkImportSessions,
  addCategory,
  renameCategory,
  removeCategory,
  Session,
} from "@carnet/core";
import { Eyebrow, Input, Button, Chip } from "../components/ui";
import { colors, fonts } from "../theme";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { Picker } from "@react-native-picker/picker";

type PickedFile = { name: string; uri: string } | null;

export default function AdminScreen() {
  const { me } = useAuth();
  const { sessions, categories, refreshSessions, refreshCategories } = useData();
  const notify = useToast();

  const [sessName, setSessName] = useState("");
  const [sessDesc, setSessDesc] = useState("");
  const [sessDetails, setSessDetails] = useState("");
  const [sessCatId, setSessCatId] = useState("");
  const [sessFile, setSessFile] = useState<PickedFile>(null);

  const [editId, setEditId] = useState<string | null>(null);
  const [editDetails, setEditDetails] = useState("");
  const [editFile, setEditFile] = useState<PickedFile | null | undefined>(undefined);

  const [newCatName, setNewCatName] = useState("");
  const [renameCatId, setRenameCatId] = useState<string | null>(null);
  const [renameCatVal, setRenameCatVal] = useState("");

  const [bulk, setBulk] = useState("");
  const [bulkCatId, setBulkCatId] = useState("");

  if (!me || me.role !== "admin") return null;

  const catName = (id: string) => categories.find((c) => c.id === id)?.name || "";

  const pickFile = async (target: "add" | "edit") => {
    const res = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/*"] });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    if ((a.size || 0) > 3 * 1024 * 1024) return notify("Fichier trop lourd (3 Mo max)", "err");
    if (target === "add") setSessFile({ name: a.name, uri: a.uri });
    else setEditFile({ name: a.name, uri: a.uri });
  };

  const handleAddSession = async () => {
    try {
      await addSession(
        { name: sessName, desc: sessDesc, details: sessDetails, catId: sessCatId, file: sessFile },
        sessions
      );
      setSessName("");
      setSessDesc("");
      setSessDetails("");
      setSessFile(null);
      await refreshSessions();
      notify("Séance ajoutée au catalogue");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Échec", "err");
    }
  };

  const startEdit = (s: Session) => {
    setEditId(s.id);
    setEditDetails(s.details || "");
    setEditFile(undefined);
  };

  const saveEdit = async (s: Session) => {
    try {
      await updateSessionDetails(s, editDetails, editFile);
      setEditId(null);
      await refreshSessions();
      notify("Séance mise à jour");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Échec", "err");
    }
  };

  const handleRemoveSession = (s: Session) => {
    Alert.alert(`Supprimer « ${s.name} » ?`, undefined, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          await removeSession(s);
          await refreshSessions();
          notify("Séance retirée du catalogue");
        },
      },
    ]);
  };

  const handleBulkImport = async () => {
    const lines = bulk.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return notify("Colle au moins une ligne", "err");
    const n = await bulkImportSessions(lines, bulkCatId, sessions);
    if (n === 0) return notify("Rien à importer : séances déjà présentes", "err");
    setBulk("");
    await refreshSessions();
    notify(`${n} séance${n > 1 ? "s" : ""} importée${n > 1 ? "s" : ""}`);
  };

  const handleAddCategory = async () => {
    try {
      await addCategory(newCatName, categories);
      setNewCatName("");
      await refreshCategories();
      notify("Catégorie créée");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Échec", "err");
    }
  };

  const saveCategoryRename = async () => {
    if (!renameCatId) return;
    try {
      await renameCategory(renameCatId, renameCatVal, categories);
      setRenameCatId(null);
      await refreshCategories();
      notify("Catégorie renommée");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Échec", "err");
    }
  };

  const handleRemoveCategory = (id: string, name: string) => {
    Alert.alert(`Supprimer « ${name} » ?`, "Ses séances redeviennent sans catégorie.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          await removeCategory(id, sessions);
          await refreshCategories();
          await refreshSessions();
          notify("Catégorie supprimée");
        },
      },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.paper }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={{ marginBottom: 28 }}>
        <Eyebrow>Catalogue des séances</Eyebrow>
        {sessions.length === 0 ? (
          <Text style={styles.empty}>Le catalogue est vide. Ajoute une première séance ci-dessous, ou importe une liste complète.</Text>
        ) : (
          sessions.map((s) => (
            <View key={s.id} style={styles.block}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <Text style={styles.name}>{s.name}</Text>
                    {s.document ? <Text>📎</Text> : null}
                    {catName(s.catId) ? <Chip label={catName(s.catId)} /> : null}
                  </View>
                  {s.desc ? <Text style={styles.muted}>{s.desc}</Text> : null}
                </View>
                <TouchableOpacity onPress={() => (editId === s.id ? setEditId(null) : startEdit(s))}>
                  <Text style={styles.link}>{editId === s.id ? "Fermer" : "Modifier"}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemoveSession(s)}>
                  <Text style={styles.linkDanger}>Suppr.</Text>
                </TouchableOpacity>
              </View>
              {editId === s.id && (
                <View style={styles.editpanel}>
                  <Input
                    placeholder="Détail des exercices (échauffement, séries, répétitions…)"
                    value={editDetails}
                    onChangeText={setEditDetails}
                    multiline
                    numberOfLines={3}
                  />
                  <Text style={styles.muted}>
                    Document : {editFile === null ? "sera retiré" : editFile ? editFile.name : s.document ? s.document.name : "aucun"}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                    <Button title={s.document || editFile ? "Remplacer le PDF" : "Joindre un PDF"} onPress={() => pickFile("edit")} />
                    {(editFile || (editFile === undefined && s.document)) && (
                      <Button title="Retirer le PDF" onPress={() => setEditFile(null)} variant="danger" />
                    )}
                    {s.document && !editFile && editFile !== null && (
                      <Button title="Télécharger le PDF" onPress={() => Linking.openURL(s.document!.url)} />
                    )}
                    <Button title="Enregistrer" onPress={() => saveEdit(s)} variant="red" />
                  </View>
                </View>
              )}
            </View>
          ))
        )}

        <View style={{ marginTop: 12, gap: 8 }}>
          <Input placeholder="Nom (ex : Fractionné 30/30)" value={sessName} onChangeText={setSessName} />
          <Input placeholder="Description courte (optionnelle)" value={sessDesc} onChangeText={setSessDesc} />
          {categories.length > 0 && (
            <View style={styles.pickerWrap}>
              <Picker selectedValue={sessCatId} onValueChange={setSessCatId}>
                <Picker.Item label="Sans catégorie" value="" />
                {categories.map((c) => (
                  <Picker.Item key={c.id} label={c.name} value={c.id} />
                ))}
              </Picker>
            </View>
          )}
          <Input
            placeholder="Détail des exercices (optionnel) — échauffement, séries, répétitions…"
            value={sessDetails}
            onChangeText={setSessDetails}
            multiline
            numberOfLines={2}
          />
          <Button title={sessFile ? `Fichier : ${sessFile.name}` : "Joindre un PDF"} onPress={() => pickFile("add")} />
          <Button title="Ajouter au catalogue" onPress={handleAddSession} />
          <Text style={styles.help}>PDF : 3 Mo max — téléchargeable par tout le monde depuis l'onglet Ma séance.</Text>
        </View>
      </View>

      <View style={{ marginBottom: 28 }}>
        <Eyebrow>Catégories</Eyebrow>
        {categories.length === 0 ? (
          <Text style={styles.empty}>Aucune catégorie pour l'instant. Crée-en pour organiser le catalogue en sous-menus.</Text>
        ) : (
          categories.map((c) => {
            const nb = sessions.filter((s) => s.catId === c.id).length;
            return (
              <View key={c.id} style={styles.row}>
                {renameCatId === c.id ? (
                  <>
                    <Input value={renameCatVal} onChangeText={setRenameCatVal} style={{ flex: 1 }} />
                    <Button title="OK" onPress={saveCategoryRename} />
                    <Button title="Annuler" onPress={() => setRenameCatId(null)} />
                  </>
                ) : (
                  <>
                    <Text style={[styles.name, { flex: 1 }]}>{c.name}</Text>
                    <Text style={styles.muted}>{nb} séance{nb > 1 ? "s" : ""}</Text>
                    <TouchableOpacity onPress={() => { setRenameCatId(c.id); setRenameCatVal(c.name); }}>
                      <Text style={styles.link}>Renommer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleRemoveCategory(c.id, c.name)}>
                      <Text style={styles.linkDanger}>Suppr.</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            );
          })
        )}
        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
          <Input placeholder="Nouvelle catégorie (ex : Cardio)" value={newCatName} onChangeText={setNewCatName} style={{ flex: 1 }} />
          <Button title="Créer" onPress={handleAddCategory} />
        </View>
      </View>

      {categories.length > 0 && sessions.length > 0 && (
        <View style={{ marginBottom: 28 }}>
          <Eyebrow>Ranger les séances</Eyebrow>
          {sessions.map((s) => (
            <View key={s.id} style={styles.row}>
              <Text style={[styles.name, { flex: 1 }]}>{s.name}</Text>
              <View style={[styles.pickerWrap, { minWidth: 160 }]}>
                <Picker selectedValue={s.catId || ""} onValueChange={(v) => moveSession(s.id, v).then(refreshSessions)}>
                  <Picker.Item label="Sans catégorie" value="" />
                  {categories.map((c) => (
                    <Picker.Item key={c.id} label={c.name} value={c.id} />
                  ))}
                </Picker>
              </View>
            </View>
          ))}
        </View>
      )}

      <View>
        <Eyebrow>Import en masse</Eyebrow>
        <Text style={styles.help}>Une séance par ligne : Nom | description | détail des exercices (les deux derniers optionnels)</Text>
        {categories.length > 0 && (
          <View style={[styles.pickerWrap, { marginTop: 8 }]}>
            <Picker selectedValue={bulkCatId} onValueChange={setBulkCatId}>
              <Picker.Item label="Importer sans catégorie" value="" />
              {categories.map((c) => (
                <Picker.Item key={c.id} label={`Importer dans : ${c.name}`} value={c.id} />
              ))}
            </Picker>
          </View>
        )}
        <Input
          placeholder={"Fractionné 30/30 | 10 × 30 s vite / 30 s lent | Échauffement 15 min\nRenfo haut du corps\nYoga mobilité | 45 min en douceur"}
          value={bulk}
          onChangeText={setBulk}
          multiline
          numberOfLines={4}
          style={{ marginTop: 8 }}
        />
        <View style={{ height: 8 }} />
        <Button title="Importer la liste" onPress={handleBulkImport} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  block: { borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 4 },
  name: { fontFamily: fonts.display, fontSize: 17, color: colors.text, textTransform: "uppercase" },
  muted: { fontFamily: fonts.body, color: colors.muted, fontSize: 12.5 },
  empty: { fontFamily: fonts.body, color: colors.muted, fontSize: 14 },
  help: { fontFamily: fonts.mono, color: colors.muted, fontSize: 11, marginTop: 6 },
  link: { fontFamily: fonts.bodyBold, color: colors.blue, fontSize: 13 },
  linkDanger: { fontFamily: fonts.bodyBold, color: colors.red, fontSize: 13 },
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
