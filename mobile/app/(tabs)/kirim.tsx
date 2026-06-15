import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, ActivityIndicator, FlatList, KeyboardAvoidingView, Modal,
  Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, useColorScheme, View,
} from 'react-native';
import api from '@/lib/api';
import type { Product, StockIn, Supplier } from '@/lib/types';

function fmt(n: number) { return n.toLocaleString('uz-UZ') + " so'm"; }
function today() { return new Date().toISOString().split('T')[0]; }

interface Form {
  productId: number | null;
  productName: string;
  quantity: string;
  unit: string;
  purchasePrice: string;
  supplierId: number | null;
  supplierName: string;
  date: string;
  note: string;
}

const emptyForm = (): Form => ({
  productId: null, productName: '', quantity: '', unit: 'kg',
  purchasePrice: '', supplierId: null, supplierName: '', date: today(), note: '',
});

export default function KirimScreen() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  const [records, setRecords] = useState<StockIn[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [supplierPickerOpen, setSupplierPickerOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [form, setForm] = useState<Form>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

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
      const [recs, prods, supps] = await Promise.all([
        api.get<StockIn[]>('/stock-in'),
        api.get<Product[]>('/products'),
        api.get<Supplier[]>('/suppliers'),
      ]);
      setRecords(recs.data);
      setProducts(prods.data);
      setSuppliers(supps.data);
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const todayStr = today();
  const monthStr = todayStr.slice(0, 7);
  const todayTotal = records.filter((r) => r.date === todayStr).reduce((s, r) => s + Number(r.totalCost), 0);
  const monthTotal = records.filter((r) => r.date.startsWith(monthStr)).reduce((s, r) => s + Number(r.totalCost), 0);

  const openAdd = () => {
    setForm(emptyForm());
    setFormError('');
    setModalVisible(true);
  };

  const handleDelete = (r: StockIn) => {
    Alert.alert(
      "O'chirish",
      `Bu kirim yozuvini o'chirasizmi?`,
      [
        { text: 'Bekor', style: 'cancel' },
        {
          text: "O'chirish", style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/stock-in/${r.id}`);
              setRecords((prev) => prev.filter((x) => x.id !== r.id));
            } catch (e: unknown) {
              const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
              Alert.alert('Xatolik', msg ?? "O'chirishda xatolik");
            }
          },
        },
      ],
    );
  };

  const selectProduct = (p: Product) => {
    setForm((prev) => ({
      ...prev,
      productId: p.id,
      productName: p.name,
      unit: p.unit,
      purchasePrice: p.purchasePrice ? String(p.purchasePrice) : prev.purchasePrice,
    }));
    setProductPickerOpen(false);
    setProductSearch('');
  };

  const selectSupplier = (s: Supplier) => {
    setForm((prev) => ({ ...prev, supplierId: s.id, supplierName: s.name }));
    setSupplierPickerOpen(false);
    setSupplierSearch('');
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.productId) return setFormError('Mahsulot tanlanishi shart');
    if (!form.quantity || Number(form.quantity) <= 0) return setFormError('Miqdor kiritilishi shart');
    if (!form.date) return setFormError('Sana kiritilishi shart');

    setSaving(true);
    try {
      const body = {
        productId: form.productId,
        quantity: Number(form.quantity),
        unit: form.unit || undefined,
        purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined,
        date: form.date,
        supplierId: form.supplierId || undefined,
        note: form.note.trim() || undefined,
      };
      const res = await api.post<StockIn>('/stock-in', body);
      setRecords((prev) => [res.data, ...prev]);
      setModalVisible(false);
    } catch (e: unknown) {
      const raw = (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const msg = Array.isArray(raw) ? raw[0] : raw;
      setFormError(msg ?? 'Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const f = (key: keyof Form) => (val: string) => setForm((prev) => ({ ...prev, [key]: val }));

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()),
  );
  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(supplierSearch.toLowerCase()),
  );

  const renderItem = ({ item: r }: { item: StockIn }) => (
    <View style={[styles.item, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={styles.itemTop}>
        <View style={styles.itemLeft}>
          <View style={[styles.iconBox, { backgroundColor: '#4F46E520' }]}>
            <Ionicons name="arrow-down-circle" size={20} color="#4F46E5" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.labelRow}>
              <View style={styles.inBadge}>
                <Text style={styles.inBadgeText}>Kelgan mahsulot</Text>
              </View>
            </View>
            <Text style={[styles.productName, { color: c.text }]} numberOfLines={1}>
              {r.product?.name ?? `Mahsulot #${r.productId}`}
            </Text>
            {r.supplier && (
              <Text style={[styles.metaText, { color: c.sub }]}>{r.supplier.name}</Text>
            )}
          </View>
        </View>
        <View style={styles.itemActions}>
          <Text style={[styles.dateBadge, { color: c.sub, backgroundColor: dark ? '#334155' : '#F1F5F9' }]}>{r.date}</Text>
          <TouchableOpacity onPress={() => handleDelete(r)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.itemBottom}>
        <Text style={[styles.qty, { color: c.sub }]}>
          {Number(r.quantity)} {r.unit} × {fmt(Number(r.purchasePrice))}
        </Text>
        <Text style={[styles.total, { color: '#4F46E5' }]}>{fmt(Number(r.totalCost))}</Text>
      </View>
      {r.note ? <Text style={[styles.note, { color: c.sub }]}>{r.note}</Text> : null}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: '#4F46E5' }]}>
          <Text style={styles.summaryLabel}>Bugungi kirim</Text>
          <Text style={styles.summaryValue}>{fmt(todayTotal)}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#0EA5E9' }]}>
          <Text style={styles.summaryLabel}>Oylik kirim</Text>
          <Text style={styles.summaryValue}>{fmt(monthTotal)}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#4F46E5" />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="arrow-down-circle-outline" size={48} color={c.sub} />
              <Text style={[styles.emptyText, { color: c.sub }]}>Kirimlar topilmadi</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openAdd} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setModalVisible(false)} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.sheetWrap}>
          <View style={[styles.sheet, { backgroundColor: c.modal }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: c.text }]}>Yangi kirim</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={c.sub} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Product picker */}
              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: c.sub }]}>Mahsulot *</Text>
                <TouchableOpacity
                  style={[styles.fieldBox, { backgroundColor: c.input, borderColor: c.border }]}
                  onPress={() => setProductPickerOpen(true)}
                >
                  <View style={styles.pickerRow}>
                    <Text style={[styles.pickerText, { color: form.productId ? c.text : c.sub }]} numberOfLines={1}>
                      {form.productName || 'Mahsulot tanlang...'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={c.sub} />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.row2}>
                <View style={[styles.fieldWrap, { flex: 1 }]}>
                  <Text style={[styles.fieldLabel, { color: c.sub }]}>Miqdor *</Text>
                  <View style={[styles.fieldBox, { backgroundColor: c.input, borderColor: c.border, flexDirection: 'row', alignItems: 'center' }]}>
                    <TextInput style={[styles.fieldInput, { color: c.text, flex: 1 }]} value={form.quantity} onChangeText={f('quantity')} keyboardType="numeric" placeholder="100" placeholderTextColor={c.sub} />
                    {form.unit ? (
                      <Text style={[styles.unitLabel, { color: '#4F46E5' }]}>{form.unit}</Text>
                    ) : null}
                  </View>
                </View>
                <View style={[styles.fieldWrap, { flex: 1 }]}>
                  <Text style={[styles.fieldLabel, { color: c.sub }]}>Xarid narxi</Text>
                  <View style={[styles.fieldBox, { backgroundColor: c.input, borderColor: c.border }]}>
                    <TextInput style={[styles.fieldInput, { color: c.text }]} value={form.purchasePrice} onChangeText={f('purchasePrice')} keyboardType="numeric" placeholder="45000" placeholderTextColor={c.sub} />
                  </View>
                </View>
              </View>

              {/* Supplier picker */}
              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: c.sub }]}>Ta'minotchi</Text>
                <TouchableOpacity
                  style={[styles.fieldBox, { backgroundColor: c.input, borderColor: c.border }]}
                  onPress={() => setSupplierPickerOpen(true)}
                >
                  <View style={styles.pickerRow}>
                    <Text style={[styles.pickerText, { color: form.supplierId ? c.text : c.sub }]} numberOfLines={1}>
                      {form.supplierName || "Ta'minotchi tanlang (ixtiyoriy)"}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={c.sub} />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: c.sub }]}>Sana *</Text>
                <View style={[styles.fieldBox, { backgroundColor: c.input, borderColor: c.border }]}>
                  <TextInput style={[styles.fieldInput, { color: c.text }]} value={form.date} onChangeText={f('date')} placeholder="2026-06-14" placeholderTextColor={c.sub} />
                </View>
              </View>

              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: c.sub }]}>Izoh</Text>
                <View style={[styles.fieldBox, { backgroundColor: c.input, borderColor: c.border }]}>
                  <TextInput style={[styles.fieldInput, { color: c.text }]} value={form.note} onChangeText={f('note')} placeholder="Ixtiyoriy..." placeholderTextColor={c.sub} />
                </View>
              </View>

              {formError ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                  <Text style={styles.errorText}>{formError}</Text>
                </View>
              ) : null}

              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#4F46E5' }, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : (
                  <><Ionicons name="add" size={20} color="#fff" /><Text style={styles.saveBtnText}>Kirim qo'shish</Text></>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Product Picker Modal */}
      <Modal visible={productPickerOpen} transparent animationType="slide" onRequestClose={() => setProductPickerOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setProductPickerOpen(false)} />
        <View style={[styles.pickerSheet, { backgroundColor: c.modal }]}>
          <View style={styles.sheetHandle} />
          <Text style={[styles.sheetTitle, { color: c.text, marginBottom: 12 }]}>Mahsulot tanlang</Text>
          <View style={[styles.searchBox, { backgroundColor: c.input, borderColor: c.border }]}>
            <Ionicons name="search-outline" size={16} color={c.sub} />
            <TextInput
              style={[styles.searchInput, { color: c.text }]}
              value={productSearch}
              onChangeText={setProductSearch}
              placeholder="Qidirish..."
              placeholderTextColor={c.sub}
              autoFocus
            />
          </View>
          <FlatList
            data={filteredProducts}
            keyExtractor={(p) => String(p.id)}
            renderItem={({ item: p }) => (
              <TouchableOpacity style={[styles.pickerItem, { borderBottomColor: c.border }]} onPress={() => selectProduct(p)}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pickerItemName, { color: c.text }]}>{p.name}</Text>
                  <Text style={[styles.pickerItemSub, { color: c.sub }]}>
                    Xarid: {p.purchasePrice ? fmt(p.purchasePrice) : '—'} · Sotish: {fmt(p.salePrice)}
                  </Text>
                </View>
                <View style={[styles.stockTag, { backgroundColor: dark ? '#334155' : '#F1F5F9' }]}>
                  <Text style={[styles.stockTagText, { color: '#4F46E5' }]}>{Number(p.stock)} {p.unit}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={[styles.emptyText, { color: c.sub, textAlign: 'center', marginTop: 20 }]}>Topilmadi</Text>}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      </Modal>

      {/* Supplier Picker Modal */}
      <Modal visible={supplierPickerOpen} transparent animationType="slide" onRequestClose={() => setSupplierPickerOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setSupplierPickerOpen(false)} />
        <View style={[styles.pickerSheet, { backgroundColor: c.modal }]}>
          <View style={styles.sheetHandle} />
          <Text style={[styles.sheetTitle, { color: c.text, marginBottom: 12 }]}>Ta'minotchi tanlang</Text>
          <View style={[styles.searchBox, { backgroundColor: c.input, borderColor: c.border }]}>
            <Ionicons name="search-outline" size={16} color={c.sub} />
            <TextInput
              style={[styles.searchInput, { color: c.text }]}
              value={supplierSearch}
              onChangeText={setSupplierSearch}
              placeholder="Qidirish..."
              placeholderTextColor={c.sub}
              autoFocus
            />
          </View>
          <TouchableOpacity
            style={[styles.pickerItem, { borderBottomColor: c.border }]}
            onPress={() => { setForm((p) => ({ ...p, supplierId: null, supplierName: '' })); setSupplierPickerOpen(false); }}
          >
            <Text style={{ color: c.sub, fontSize: 14 }}>— Tanlamaslik —</Text>
          </TouchableOpacity>
          <FlatList
            data={filteredSuppliers}
            keyExtractor={(s) => String(s.id)}
            renderItem={({ item: s }) => (
              <TouchableOpacity style={[styles.pickerItem, { borderBottomColor: c.border }]} onPress={() => selectSupplier(s)}>
                <View>
                  <Text style={[styles.pickerItemName, { color: c.text }]}>{s.name}</Text>
                  {s.phone && <Text style={[styles.pickerItemSub, { color: c.sub }]}>{s.phone}</Text>}
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={[styles.emptyText, { color: c.sub, textAlign: 'center', marginTop: 20 }]}>Topilmadi</Text>}
            keyboardShouldPersistTaps="handled"
          />
        </View>
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
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600', marginBottom: 4 },
  summaryValue: { color: '#fff', fontSize: 15, fontWeight: '800' },
  list: { paddingHorizontal: 12, paddingBottom: 100 },
  item: {
    padding: 14, borderRadius: 14, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  productName: { fontSize: 15, fontWeight: '600' },
  metaText: { fontSize: 12, marginTop: 2 },
  itemActions: { alignItems: 'flex-end', gap: 6 },
  dateBadge: { fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  itemBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qty: { fontSize: 13 },
  total: { fontSize: 15, fontWeight: '800' },
  note: { fontSize: 12, marginTop: 6, fontStyle: 'italic' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15 },
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center',
    elevation: 8, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10,
  },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheetWrap: { justifyContent: 'flex-end', flex: 1 },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36, maxHeight: '90%',
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1',
    alignSelf: 'center', marginBottom: 16,
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  row2: { flexDirection: 'row', gap: 10 },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  fieldBox: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 12 },
  fieldInput: { fontSize: 15, paddingVertical: 12 },
  pickerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 13,
  },
  pickerText: { fontSize: 15, flex: 1 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, marginBottom: 14,
  },
  errorText: { color: '#DC2626', fontSize: 13, flex: 1 },
  saveBtn: {
    borderRadius: 14, paddingVertical: 15,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  pickerSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36, maxHeight: '75%',
  },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 10 },
  pickerItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1,
  },
  pickerItemName: { fontSize: 14, fontWeight: '600' },
  pickerItemSub: { fontSize: 12, marginTop: 2 },
  stockTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  stockTagText: { fontSize: 12, fontWeight: '700' },
  unitLabel: { fontSize: 13, fontWeight: '700', paddingRight: 4 },
  labelRow: { flexDirection: 'row', marginBottom: 4 },
  inBadge: { backgroundColor: '#4F46E520', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  inBadgeText: { fontSize: 10, fontWeight: '700', color: '#4F46E5' },
});
