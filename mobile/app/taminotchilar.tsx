import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Modal, RefreshControl, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import api from '@/lib/api';
import type { Supplier } from '@/lib/types';

export default function TaminotchilarScreen() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  const [list, setList] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', note: '' });

  const c = {
    bg: dark ? '#0F172A' : '#F8FAFC',
    card: dark ? '#1E293B' : '#FFFFFF',
    text: dark ? '#F1F5F9' : '#0F172A',
    sub: dark ? '#94A3B8' : '#64748B',
    border: dark ? '#334155' : '#E2E8F0',
    input: dark ? '#0F172A' : '#F8FAFC',
    modal: dark ? '#1E293B' : '#FFFFFF',
  };

  const load = useCallback(async () => {
    try {
      const res = await api.get<Supplier[]>('/suppliers');
      setList(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = list.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.phone ?? '').includes(search)
  );

  const handleAdd = async () => {
    if (!form.name.trim()) return Alert.alert('Xato', 'Nomi kiritilishi shart');
    setSaving(true);
    try {
      await api.post('/suppliers', {
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        note: form.note.trim() || undefined,
      });
      setShowModal(false);
      setForm({ name: '', phone: '', address: '', note: '' });
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Alert.alert('Xato', msg ?? 'Xatolik yuz berdi');
    } finally { setSaving(false); }
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert("O'chirish", `"${name}" ta'minotchini o'chirishni tasdiqlaysizmi?`, [
      { text: 'Bekor', style: 'cancel' },
      { text: "O'chirish", style: 'destructive', onPress: async () => { await api.delete(`/suppliers/${id}`); load(); } },
    ]);
  };

  const inputStyle = [styles.input, { backgroundColor: c.input, borderColor: c.border, color: c.text }];

  const renderItem = ({ item: s }: { item: Supplier }) => (
    <View style={[styles.item, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={styles.itemLeft}>
        <View style={[styles.avatar, { backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="business" size={20} color="#F59E0B" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.itemName, { color: c.text }]}>{s.name}</Text>
          {s.phone && (
            <Text style={[styles.itemSub, { color: c.sub }]}>
              <Ionicons name="call-outline" size={12} /> {s.phone}
            </Text>
          )}
          {s.address && (
            <Text style={[styles.itemSub, { color: c.sub }]} numberOfLines={1}>
              <Ionicons name="location-outline" size={12} /> {s.address}
            </Text>
          )}
          {s.note && (
            <Text style={[styles.itemNote, { color: c.sub }]} numberOfLines={1}>{s.note}</Text>
          )}
        </View>
      </View>
      <TouchableOpacity onPress={() => handleDelete(s.id, s.name)} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={18} color="#DC2626" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Search + Add */}
      <View style={styles.topRow}>
        <View style={[styles.searchWrap, { backgroundColor: c.card, borderColor: c.border }]}>
          <Ionicons name="search-outline" size={17} color={c.sub} />
          <TextInput
            style={[styles.searchInput, { color: c.text }]}
            placeholder="Qidirish..."
            placeholderTextColor={c.sub}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={17} color={c.sub} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Count */}
      <Text style={[styles.countText, { color: c.sub }]}>Jami: {filtered.length} ta'minotchi</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#F59E0B" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#F59E0B" />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="business-outline" size={48} color={c.sub} />
              <Text style={[styles.emptyText, { color: c.sub }]}>Ta'minotchilar topilmadi</Text>
            </View>
          }
        />
      )}

      {/* Add Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: c.modal }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: c.text }]}>Ta'minotchi qo'shish</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={c.sub} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.fieldLabel, { color: c.sub }]}>Nomi *</Text>
              <TextInput style={inputStyle} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholder="Toshkent Sement Zavodi" placeholderTextColor={c.sub} autoFocus />
              <Text style={[styles.fieldLabel, { color: c.sub }]}>Telefon</Text>
              <TextInput style={inputStyle} value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} placeholder="+998901234567" placeholderTextColor={c.sub} keyboardType="phone-pad" />
              <Text style={[styles.fieldLabel, { color: c.sub }]}>Manzil</Text>
              <TextInput style={inputStyle} value={form.address} onChangeText={(v) => setForm({ ...form, address: v })} placeholder="Toshkent, Yunusobod" placeholderTextColor={c.sub} />
              <Text style={[styles.fieldLabel, { color: c.sub }]}>Izoh</Text>
              <TextInput style={inputStyle} value={form.note} onChangeText={(v) => setForm({ ...form, note: v })} placeholder="Qo'shimcha ma'lumot..." placeholderTextColor={c.sub} />
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleAdd}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topRow: { flexDirection: 'row', gap: 10, padding: 12, alignItems: 'center' },
  searchWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 12,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 10 },
  addBtn: {
    backgroundColor: '#F59E0B', borderRadius: 12, width: 44, height: 44,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  countText: { fontSize: 12, paddingHorizontal: 12, marginBottom: 6 },
  list: { paddingHorizontal: 12, paddingBottom: 20 },
  item: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 14, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  itemName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  itemSub: { fontSize: 12, marginTop: 1 },
  itemNote: { fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  deleteBtn: { padding: 8 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  fieldLabel: { fontSize: 13, fontWeight: '500', marginBottom: 6, marginTop: 12 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15 },
  saveBtn: { backgroundColor: '#F59E0B', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 20, marginBottom: 8 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
