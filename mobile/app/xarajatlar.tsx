import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Modal, RefreshControl, StyleSheet,
  Text, TextInput, TouchableOpacity, useColorScheme, View,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import api from '@/lib/api';
import type { Expense } from '@/lib/types';

function fmt(n: number) { return n.toLocaleString('uz-UZ') + " so'm"; }
function today() { return new Date().toISOString().split('T')[0]; }

const CATEGORIES: { key: string; label: string; icon: string; color: string }[] = [
  { key: 'elektr', label: 'Elektr', icon: 'flash-outline', color: '#EAB308' },
  { key: 'transport', label: 'Transport', icon: 'car-outline', color: '#3B82F6' },
  { key: 'ish_haqi', label: 'Ish haqi', icon: 'people-outline', color: '#8B5CF6' },
  { key: 'internet', label: 'Internet', icon: 'wifi-outline', color: '#06B6D4' },
  { key: 'boshqa', label: 'Boshqa', icon: 'ellipsis-horizontal-outline', color: '#6B7280' },
];

const catMeta = (key: string) => CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[4];

export default function XarajatlarScreen() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  const [list, setList] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [catFilter, setCatFilter] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ category: 'boshqa', amount: '', date: today(), note: '' });

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
      const res = await api.get<Expense[]>('/expenses');
      setList(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = catFilter === 'ALL' ? list : list.filter((e) => e.category.toLowerCase() === catFilter);
  const totalSum = filtered.reduce((s, e) => s + Number(e.amount), 0);

  const monthStr = today().slice(0, 7);
  const monthTotal = list.filter((e) => e.date.startsWith(monthStr)).reduce((s, e) => s + Number(e.amount), 0);

  const handleAdd = async () => {
    if (!form.amount || Number(form.amount) <= 0) return Alert.alert('Xato', 'Summa kiritilishi shart');
    if (!form.date) return Alert.alert('Xato', 'Sana kiritilishi shart');
    setSaving(true);
    try {
      await api.post('/expenses', { category: form.category, amount: Number(form.amount), date: form.date, note: form.note.trim() || undefined });
      setShowModal(false);
      setForm({ category: 'BOSHQA', amount: '', date: today(), note: '' });
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Alert.alert('Xato', msg ?? 'Xatolik yuz berdi');
    } finally { setSaving(false); }
  };

  const handleDelete = (id: number) => {
    Alert.alert("O'chirish", "Xarajatni o'chirishni tasdiqlaysizmi?", [
      { text: 'Bekor', style: 'cancel' },
      { text: "O'chirish", style: 'destructive', onPress: async () => { await api.delete(`/expenses/${id}`); load(); } },
    ]);
  };

  const inputStyle = [styles.input, { backgroundColor: c.input, borderColor: c.border, color: c.text }];

  const renderItem = ({ item: e }: { item: Expense }) => {
    const meta = catMeta(e.category);
    return (
      <View style={[styles.item, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={[styles.iconBox, { backgroundColor: meta.color + '20' }]}>
          <Ionicons name={meta.icon as never} size={20} color={meta.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.catLabel, { color: c.text }]}>{meta.label}</Text>
          <Text style={[styles.dateText, { color: c.sub }]}>{e.date}</Text>
          {e.note && <Text style={[styles.noteText, { color: c.sub }]} numberOfLines={1}>{e.note}</Text>}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.amtText, { color: meta.color }]}>{fmt(Number(e.amount))}</Text>
          <TouchableOpacity onPress={() => handleDelete(e.id)} style={{ padding: 4, marginTop: 4 }}>
            <Ionicons name="trash-outline" size={16} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Summary banner */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: '#8B5CF6' }]}>
          <Text style={styles.summaryLabel}>Oy bo'yicha xarajat</Text>
          <Text style={styles.summaryValue}>{fmt(monthTotal)}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          style={[styles.summaryCard, { backgroundColor: '#6D28D9', justifyContent: 'center', alignItems: 'center' }]}
        >
          <Ionicons name="add-circle" size={28} color="#fff" />
          <Text style={[styles.summaryLabel, { marginTop: 4 }]}>Xarajat qo'shish</Text>
        </TouchableOpacity>
      </View>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        <TouchableOpacity
          onPress={() => setCatFilter('ALL')}
          style={[styles.filterChip, catFilter === 'ALL' && { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' }]}
        >
          <Text style={[styles.filterChipText, catFilter === 'ALL' && { color: '#fff' }]}>Barchasi</Text>
        </TouchableOpacity>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            onPress={() => setCatFilter(cat.key)}
            style={[styles.filterChip, catFilter === cat.key && { backgroundColor: cat.color, borderColor: cat.color }]}
          >
            <Ionicons name={cat.icon as never} size={13} color={catFilter === cat.key ? '#fff' : cat.color} />
            <Text style={[styles.filterChipText, { color: catFilter === cat.key ? '#fff' : c.sub }]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {catFilter !== 'ALL' && (
        <Text style={[styles.totalLine, { color: c.sub }]}>
          {catMeta(catFilter).label}: {fmt(totalSum)}
        </Text>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#8B5CF6" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#8B5CF6" />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={48} color={c.sub} />
              <Text style={[styles.emptyText, { color: c.sub }]}>Xarajatlar topilmadi</Text>
            </View>
          }
        />
      )}

      {/* Add Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: c.modal }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: c.text }]}>Xarajat qo'shish</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={c.sub} />
              </TouchableOpacity>
            </View>

            {/* Category picker */}
            <Text style={[styles.fieldLabel, { color: c.sub }]}>Kategoriya</Text>
            <View style={styles.catGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  onPress={() => setForm({ ...form, category: cat.key })}
                  style={[
                    styles.catChip,
                    { borderColor: cat.color + '60' },
                    form.category === cat.key && { backgroundColor: cat.color, borderColor: cat.color },
                  ]}
                >
                  <Ionicons name={cat.icon as never} size={16} color={form.category === cat.key ? '#fff' : cat.color} />
                  <Text style={[styles.catChipText, { color: form.category === cat.key ? '#fff' : c.text }]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: c.sub }]}>Summa (so'm) *</Text>
            <TextInput style={inputStyle} value={form.amount} onChangeText={(v) => setForm({ ...form, amount: v })} placeholder="50000" placeholderTextColor={c.sub} keyboardType="numeric" autoFocus />

            <Text style={[styles.fieldLabel, { color: c.sub }]}>Sana *</Text>
            <TextInput style={inputStyle} value={form.date} onChangeText={(v) => setForm({ ...form, date: v })} placeholder="2026-06-12" placeholderTextColor={c.sub} />

            <Text style={[styles.fieldLabel, { color: c.sub }]}>Izoh</Text>
            <TextInput style={inputStyle} value={form.note} onChangeText={(v) => setForm({ ...form, note: v })} placeholder="Izoh..." placeholderTextColor={c.sub} />

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleAdd}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summaryRow: { flexDirection: 'row', gap: 12, padding: 12 },
  summaryCard: {
    flex: 1, borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600', marginBottom: 4, textAlign: 'center' },
  summaryValue: { color: '#fff', fontSize: 15, fontWeight: '800' },
  filterRow: { paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0',
  },
  filterChipText: { fontSize: 12, fontWeight: '600' },
  totalLine: { fontSize: 12, paddingHorizontal: 12, marginBottom: 6 },
  list: { paddingHorizontal: 12, paddingBottom: 20 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderRadius: 14, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  catLabel: { fontSize: 15, fontWeight: '600' },
  dateText: { fontSize: 12, marginTop: 2 },
  noteText: { fontSize: 12, marginTop: 2, fontStyle: 'italic' },
  amtText: { fontSize: 15, fontWeight: '800' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  fieldLabel: { fontSize: 13, fontWeight: '500', marginBottom: 6, marginTop: 12 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5,
  },
  catChipText: { fontSize: 13, fontWeight: '600' },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15 },
  saveBtn: { backgroundColor: '#8B5CF6', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 20, marginBottom: 8 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
