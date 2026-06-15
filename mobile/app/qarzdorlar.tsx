import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Modal, RefreshControl, StyleSheet,
  Text, TextInput, TouchableOpacity, useColorScheme, View, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import api from '@/lib/api';
import type { Debtor } from '@/lib/types';

function fmt(n: number) { return n.toLocaleString('uz-UZ') + " so'm"; }
function today() { return new Date().toISOString().split('T')[0]; }

export default function QarzdorlarScreen() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'paid'>('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payTarget, setPayTarget] = useState<Debtor | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ name: '', phone: '', product: '', totalAmount: '', paidAmount: '', debtDate: today(), note: '' });
  const [payForm, setPayForm] = useState({ amount: '', paymentDate: today(), note: '' });

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
      const res = await api.get<Debtor[]>('/debtors');
      setDebtors(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = debtors.filter((d) => {
    const rem = Number(d.totalAmount) - Number(d.paidAmount);
    if (filter === 'active') return rem > 0;
    if (filter === 'paid') return rem <= 0;
    return true;
  });

  const totalDebt = filtered.reduce((s, d) => s + Math.max(0, Number(d.totalAmount) - Number(d.paidAmount)), 0);

  const handleAdd = async () => {
    if (!form.name.trim()) return Alert.alert('Xato', 'F.I.O kiritilishi shart');
    if (!form.totalAmount || Number(form.totalAmount) <= 0) return Alert.alert('Xato', 'Summa kiritilishi shart');
    if (!form.debtDate) return Alert.alert('Xato', 'Sana kiritilishi shart');
    setSaving(true);
    try {
      await api.post('/debtors', {
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        product: form.product.trim() || undefined,
        totalAmount: Number(form.totalAmount),
        paidAmount: Number(form.paidAmount || 0),
        debtDate: form.debtDate,
        note: form.note.trim() || undefined,
      });
      setShowAddModal(false);
      setForm({ name: '', phone: '', product: '', totalAmount: '', paidAmount: '', debtDate: today(), note: '' });
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Alert.alert('Xato', msg ?? 'Xatolik yuz berdi');
    } finally { setSaving(false); }
  };

  const handlePay = async () => {
    if (!payTarget) return;
    const amount = Number(payForm.amount);
    const rem = Number(payTarget.totalAmount) - Number(payTarget.paidAmount);
    if (!amount || amount <= 0) return Alert.alert('Xato', 'Summa kiritilishi shart');
    if (amount > rem + 0.01) return Alert.alert('Xato', `Qolgan qarz: ${fmt(rem)}`);
    setSaving(true);
    try {
      await api.post(`/debtors/${payTarget.id}/payment`, { amount, paymentDate: payForm.paymentDate, note: payForm.note || undefined });
      setShowPayModal(false);
      setPayTarget(null);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Alert.alert('Xato', msg ?? 'Xatolik yuz berdi');
    } finally { setSaving(false); }
  };

  const handleDelete = (id: number) => {
    Alert.alert("O'chirish", "Qarzdorni o'chirishni tasdiqlaysizmi?", [
      { text: 'Bekor', style: 'cancel' },
      { text: "O'chirish", style: 'destructive', onPress: async () => { await api.delete(`/debtors/${id}`); load(); } },
    ]);
  };

  const inputStyle = [styles.input, { backgroundColor: c.input, borderColor: c.border, color: c.text }];

  const renderItem = ({ item: d }: { item: Debtor }) => {
    const rem = Math.max(0, Number(d.totalAmount) - Number(d.paidAmount));
    const isPaid = rem <= 0;
    return (
      <View style={[styles.item, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={styles.itemHeader}>
          <View style={styles.itemLeft}>
            <View style={[styles.avatar, { backgroundColor: isPaid ? '#DCFCE7' : '#FEE2E2' }]}>
              <Ionicons name="person" size={18} color={isPaid ? '#166534' : '#DC2626'} />
            </View>
            <View>
              <Text style={[styles.debtorName, { color: c.text }]}>{d.name}</Text>
              {d.phone ? <Text style={[styles.phone, { color: c.sub }]}>{d.phone}</Text> : null}
              {d.product ? <Text style={[styles.product, { color: c.sub }]}>{d.product}</Text> : null}
            </View>
          </View>
          <View style={styles.actions}>
            {!isPaid && (
              <TouchableOpacity
                onPress={() => { setPayTarget(d); setPayForm({ amount: '', paymentDate: today(), note: '' }); setShowPayModal(true); }}
                style={[styles.actionBtn, { backgroundColor: '#DCFCE7' }]}
              >
                <Ionicons name="card-outline" size={16} color="#166534" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => handleDelete(d.id)} style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="trash-outline" size={16} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.amtRow}>
          <View style={styles.amtItem}>
            <Text style={[styles.amtLabel, { color: c.sub }]}>Jami</Text>
            <Text style={[styles.amtVal, { color: c.text }]}>{fmt(Number(d.totalAmount))}</Text>
          </View>
          <View style={styles.amtItem}>
            <Text style={[styles.amtLabel, { color: c.sub }]}>To'landi</Text>
            <Text style={[styles.amtVal, { color: '#059669' }]}>{fmt(Number(d.paidAmount))}</Text>
          </View>
          <View style={styles.amtItem}>
            <Text style={[styles.amtLabel, { color: c.sub }]}>Qoldi</Text>
            {isPaid ? (
              <Text style={[styles.amtVal, { color: '#059669' }]}>✓ Yopildi</Text>
            ) : (
              <Text style={[styles.amtVal, { color: '#DC2626' }]}>{fmt(rem)}</Text>
            )}
          </View>
        </View>
        {d.debtDate && (
          <Text style={[styles.dateInfo, { color: c.sub }]}>
            📅 Qarz olingan: {d.debtDate}
            {d.lastPaymentDate ? `  · Oxirgi to'lov: ${d.lastPaymentDate}` : ''}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Header summary */}
      <View style={[styles.summaryBanner, { backgroundColor: '#EF444410', borderColor: '#FECACA' }]}>
        <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
        <Text style={[styles.summaryText, { color: '#DC2626' }]}>Jami qolgan qarz: {fmt(totalDebt)}</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addBtn}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {(['all', 'active', 'paid'] as const).map((key) => (
          <TouchableOpacity
            key={key}
            onPress={() => setFilter(key)}
            style={[styles.filterBtn, filter === key && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, filter === key && styles.filterTextActive]}>
              {key === 'all' ? 'Barchasi' : key === 'active' ? 'Faol' : 'Yopilgan'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#EF4444" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#EF4444" />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={c.sub} />
              <Text style={[styles.emptyText, { color: c.sub }]}>Qarzdorlar topilmadi</Text>
            </View>
          }
        />
      )}

      {/* Add Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: c.modal }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: c.text }]}>Qarz qo'shish</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={c.sub} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.fieldLabel, { color: c.sub }]}>F.I.O *</Text>
              <TextInput style={inputStyle} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholder="Ahmadov Jasur" placeholderTextColor={c.sub} />
              <Text style={[styles.fieldLabel, { color: c.sub }]}>Telefon</Text>
              <TextInput style={inputStyle} value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} placeholder="+998901234567" placeholderTextColor={c.sub} keyboardType="phone-pad" />
              <Text style={[styles.fieldLabel, { color: c.sub }]}>Mahsulot</Text>
              <TextInput style={inputStyle} value={form.product} onChangeText={(v) => setForm({ ...form, product: v })} placeholder="Sement M500" placeholderTextColor={c.sub} />
              <Text style={[styles.fieldLabel, { color: c.sub }]}>Jami summa (so'm) *</Text>
              <TextInput style={inputStyle} value={form.totalAmount} onChangeText={(v) => setForm({ ...form, totalAmount: v })} placeholder="500000" placeholderTextColor={c.sub} keyboardType="numeric" />
              <Text style={[styles.fieldLabel, { color: c.sub }]}>To'langan summa</Text>
              <TextInput style={inputStyle} value={form.paidAmount} onChangeText={(v) => setForm({ ...form, paidAmount: v })} placeholder="0" placeholderTextColor={c.sub} keyboardType="numeric" />
              <Text style={[styles.fieldLabel, { color: c.sub }]}>Qarz olingan sana *</Text>
              <TextInput style={inputStyle} value={form.debtDate} onChangeText={(v) => setForm({ ...form, debtDate: v })} placeholder="2026-06-12" placeholderTextColor={c.sub} />
              <Text style={[styles.fieldLabel, { color: c.sub }]}>Izoh</Text>
              <TextInput style={inputStyle} value={form.note} onChangeText={(v) => setForm({ ...form, note: v })} placeholder="Izoh..." placeholderTextColor={c.sub} />
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

      {/* Payment Modal */}
      <Modal visible={showPayModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: c.modal }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: c.text }]}>To'lov qo'shish</Text>
              <TouchableOpacity onPress={() => setShowPayModal(false)}>
                <Ionicons name="close" size={24} color={c.sub} />
              </TouchableOpacity>
            </View>
            {payTarget && (
              <View style={[styles.debtInfo, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                <Text style={styles.debtInfoName}>{payTarget.name}</Text>
                <Text style={styles.debtInfoAmt}>
                  Qolgan qarz: {fmt(Math.max(0, Number(payTarget.totalAmount) - Number(payTarget.paidAmount)))}
                </Text>
              </View>
            )}
            <Text style={[styles.fieldLabel, { color: c.sub }]}>To'lov miqdori *</Text>
            <TextInput style={inputStyle} value={payForm.amount} onChangeText={(v) => setPayForm({ ...payForm, amount: v })} placeholder="50000" placeholderTextColor={c.sub} keyboardType="numeric" autoFocus />
            <Text style={[styles.fieldLabel, { color: c.sub }]}>To'lov sanasi *</Text>
            <TextInput style={inputStyle} value={payForm.paymentDate} onChangeText={(v) => setPayForm({ ...payForm, paymentDate: v })} placeholder="2026-06-12" placeholderTextColor={c.sub} />
            <Text style={[styles.fieldLabel, { color: c.sub }]}>Izoh</Text>
            <TextInput style={inputStyle} value={payForm.note} onChangeText={(v) => setPayForm({ ...payForm, note: v })} placeholder="Naqd to'lov" placeholderTextColor={c.sub} />
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: '#059669' }, saving && styles.saveBtnDisabled]}
              onPress={handlePay}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Saqlanmoqda...' : "To'lovni saqlash"}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summaryBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    margin: 12, padding: 12, borderRadius: 12, borderWidth: 1,
  },
  summaryText: { flex: 1, fontSize: 14, fontWeight: '700' },
  addBtn: { backgroundColor: '#EF4444', borderRadius: 8, padding: 6 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, marginBottom: 8 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  filterBtnActive: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  filterTextActive: { color: '#fff' },
  list: { paddingHorizontal: 12, paddingBottom: 20 },
  item: { padding: 14, borderRadius: 14, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  debtorName: { fontSize: 15, fontWeight: '700' },
  phone: { fontSize: 12, marginTop: 1 },
  product: { fontSize: 12, marginTop: 1, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 6 },
  actionBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  amtRow: { flexDirection: 'row', gap: 8 },
  amtItem: { flex: 1 },
  amtLabel: { fontSize: 11, marginBottom: 2 },
  amtVal: { fontSize: 13, fontWeight: '700' },
  dateInfo: { fontSize: 11, marginTop: 8 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  fieldLabel: { fontSize: 13, fontWeight: '500', marginBottom: 6, marginTop: 12 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15 },
  saveBtn: { backgroundColor: '#4F46E5', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 20, marginBottom: 8 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  debtInfo: { borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 4 },
  debtInfoName: { fontSize: 15, fontWeight: '700', color: '#DC2626' },
  debtInfoAmt: { fontSize: 13, color: '#DC2626', marginTop: 2 },
});
