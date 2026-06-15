import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Modal,
  Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, useColorScheme, View,
} from 'react-native';
import api, { BASE_URL } from '@/lib/api';
import type { Product, StockOut } from '@/lib/types';

const IMAGE_BASE = BASE_URL.replace('/api', '');

function fmt(n: number) { return n.toLocaleString('uz-UZ') + " so'm"; }
function today() { return new Date().toISOString().split('T')[0]; }

interface Form {
  productId: number | null;
  productName: string;
  quantity: string;
  unit: string;
  purchasePrice: string;
  salePrice: string;
  customer: string;
  date: string;
  note: string;
}

const emptyForm = (): Form => ({
  productId: null, productName: '', quantity: '', unit: 'kg',
  purchasePrice: '', salePrice: '', customer: '', date: today(), note: '',
});

export default function SotuvScreen() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  const [records, setRecords] = useState<StockOut[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
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
      const [recs, prods] = await Promise.all([
        api.get<StockOut[]>('/stock-out'),
        api.get<Product[]>('/products'),
      ]);
      setRecords(recs.data);
      setProducts(prods.data);
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const todayStr = today();
  const monthStr = todayStr.slice(0, 7);
  const todayTotal = records.filter((r) => r.date === todayStr).reduce((s, r) => s + Number(r.totalAmount), 0);
  const monthTotal = records.filter((r) => r.date.startsWith(monthStr)).reduce((s, r) => s + Number(r.totalAmount), 0);

  const openAdd = () => {
    setForm(emptyForm());
    setFormError('');
    setModalVisible(true);
  };

  const handleDelete = (r: StockOut) => {
    Alert.alert("O'chirish", "Bu sotuv yozuvini o'chirasizmi?", [
      { text: 'Bekor', style: 'cancel' },
      {
        text: "O'chirish", style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/stock-out/${r.id}`);
            setRecords((prev) => prev.filter((x) => x.id !== r.id));
          } catch (e: unknown) {
            const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
            Alert.alert('Xatolik', msg ?? "O'chirishda xatolik");
          }
        },
      },
    ]);
  };

  const selectProduct = (p: Product) => {
    setForm((prev) => ({
      ...prev,
      productId: p.id,
      productName: p.name,
      unit: p.unit,
      purchasePrice: p.purchasePrice ? String(p.purchasePrice) : '',
      salePrice: p.salePrice ? String(p.salePrice) : prev.salePrice,
    }));
    setProductPickerOpen(false);
    setProductSearch('');
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
        salePrice: form.salePrice ? Number(form.salePrice) : undefined,
        customer: form.customer.trim() || undefined,
        date: form.date,
        note: form.note.trim() || undefined,
      };
      const res = await api.post<StockOut>('/stock-out', body);
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

  const selectedProduct = products.find((p) => p.id === form.productId);
  const qty = Number(form.quantity) || 0;
  const sale = Number(form.salePrice) || 0;
  const purchase = Number(form.purchasePrice) || 0;
  const totalSale = qty * sale;
  const profit = qty * (sale - purchase);

  const renderItem = ({ item: r }: { item: StockOut }) => {
    const purchaseP = r.product?.purchasePrice ?? 0;
    const saleP = Number(r.salePrice);
    const profitPerUnit = saleP - Number(purchaseP);
    const totalProfit = profitPerUnit * Number(r.quantity);
    const imageUrl = r.product?.image
      ? (r.product.image.startsWith('http') ? r.product.image : `${IMAGE_BASE}${r.product.image}`)
      : null;

    return (
      <View style={[styles.item, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={styles.itemTop}>
          <View style={styles.itemLeft}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.productImage} />
            ) : (
              <View style={[styles.iconBox, { backgroundColor: '#05966920' }]}>
                <Ionicons name="arrow-up-circle" size={20} color="#059669" />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <View style={styles.labelRow}>
                <View style={styles.soldBadge}>
                  <Text style={styles.soldBadgeText}>Sotilgan</Text>
                </View>
              </View>
              <Text style={[styles.productName, { color: c.text }]} numberOfLines={1}>
                {r.product?.name ?? `Mahsulot #${r.productId}`}
              </Text>
              {r.customer && <Text style={[styles.metaText, { color: c.sub }]}>{r.customer}</Text>}
            </View>
          </View>
          <View style={styles.itemActions}>
            <Text style={[styles.dateBadge, { color: c.sub, backgroundColor: dark ? '#334155' : '#F1F5F9' }]}>{r.date}</Text>
            <TouchableOpacity onPress={() => handleDelete(r)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Prices row */}
        <View style={[styles.pricesRow, { backgroundColor: dark ? '#0F172A' : '#F8FAFC', borderColor: c.border }]}>
          <View style={styles.priceCell}>
            <Text style={[styles.priceCellLabel, { color: c.sub }]}>Miqdor</Text>
            <Text style={[styles.priceCellValue, { color: c.text }]}>{Number(r.quantity)} {r.unit}</Text>
          </View>
          <View style={[styles.priceDivider, { backgroundColor: c.border }]} />
          <View style={styles.priceCell}>
            <Text style={[styles.priceCellLabel, { color: c.sub }]}>Kelgan</Text>
            <Text style={[styles.priceCellValue, { color: c.sub }]}>
              {purchaseP ? fmt(Number(purchaseP)) : '—'}
            </Text>
          </View>
          <View style={[styles.priceDivider, { backgroundColor: c.border }]} />
          <View style={styles.priceCell}>
            <Text style={[styles.priceCellLabel, { color: c.sub }]}>Sotilgan</Text>
            <Text style={[styles.priceCellValue, { color: '#059669', fontWeight: '700' }]}>{fmt(saleP)}</Text>
          </View>
          <View style={[styles.priceDivider, { backgroundColor: c.border }]} />
          <View style={styles.priceCell}>
            <Text style={[styles.priceCellLabel, { color: c.sub }]}>Foyda</Text>
            <Text style={[styles.priceCellValue, { color: totalProfit >= 0 ? '#059669' : '#EF4444', fontWeight: '700' }]}>
              {totalProfit >= 0 ? '+' : ''}{fmt(totalProfit)}
            </Text>
          </View>
        </View>

        <View style={styles.itemBottom}>
          <Text style={[styles.qty, { color: c.sub }]}>
            {Number(r.quantity)} {r.unit} × {fmt(saleP)}
          </Text>
          <Text style={[styles.total, { color: '#059669' }]}>{fmt(Number(r.totalAmount))}</Text>
        </View>
        {r.note ? <Text style={[styles.note, { color: c.sub }]}>{r.note}</Text> : null}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: '#059669' }]}>
          <Text style={styles.summaryLabel}>Bugungi sotuv</Text>
          <Text style={styles.summaryValue}>{fmt(todayTotal)}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#0D9488' }]}>
          <Text style={styles.summaryLabel}>Oylik sotuv</Text>
          <Text style={styles.summaryValue}>{fmt(monthTotal)}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#059669" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#059669" />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="arrow-up-circle-outline" size={48} color={c.sub} />
              <Text style={[styles.emptyText, { color: c.sub }]}>Sotuv topilmadi</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}

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
              <Text style={[styles.sheetTitle, { color: c.text }]}>Yangi sotuv</Text>
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
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.pickerText, { color: form.productId ? c.text : c.sub }]} numberOfLines={1}>
                        {form.productName || 'Mahsulot tanlang...'}
                      </Text>
                      {selectedProduct && (
                        <Text style={{ color: c.sub, fontSize: 11, marginTop: 2 }}>
                          Stok: {Number(selectedProduct.stock)} {selectedProduct.unit}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-down" size={16} color={c.sub} />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Prices: kelgan vs sotiladigan */}
              <View style={styles.row2}>
                <View style={[styles.fieldWrap, { flex: 1 }]}>
                  <Text style={[styles.fieldLabel, { color: c.sub }]}>Kelgan narx</Text>
                  <View style={[styles.fieldBox, { backgroundColor: dark ? '#0F172A40' : '#F1F5F9', borderColor: c.border }]}>
                    <TextInput
                      style={[styles.fieldInput, { color: c.sub }]}
                      value={form.purchasePrice}
                      editable={false}
                      placeholder="—"
                      placeholderTextColor={c.sub}
                    />
                  </View>
                </View>
                <View style={[styles.fieldWrap, { flex: 1 }]}>
                  <Text style={[styles.fieldLabel, { color: '#059669' }]}>Sotuv narxi ✏️</Text>
                  <View style={[styles.fieldBox, { backgroundColor: c.input, borderColor: '#059669' }]}>
                    <TextInput
                      style={[styles.fieldInput, { color: c.text }]}
                      value={form.salePrice}
                      onChangeText={f('salePrice')}
                      placeholder="50000"
                      keyboardType="numeric"
                      placeholderTextColor={c.sub}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: c.sub }]}>Miqdor *</Text>
                <View style={[styles.fieldBox, { backgroundColor: c.input, borderColor: c.border }]}>
                  <TextInput style={[styles.fieldInput, { color: c.text }]} value={form.quantity} onChangeText={f('quantity')} keyboardType="numeric" placeholder="10" placeholderTextColor={c.sub} />
                </View>
              </View>

              {/* Stock & profit preview */}
              {selectedProduct && (
                <View style={[styles.previewBox, { backgroundColor: dark ? '#0F1A2A' : '#EFF6FF', borderColor: '#BFDBFE' }]}>
                  <View style={styles.previewRow}>
                    <Text style={[styles.previewLabel, { color: c.sub }]}>Mavjud stok:</Text>
                    <Text style={[styles.previewValue, { color: '#3B82F6' }]}>
                      {Number(selectedProduct.stock)} {selectedProduct.unit}
                    </Text>
                  </View>
                  {qty > 0 && (
                    <View style={styles.previewRow}>
                      <Text style={[styles.previewLabel, { color: c.sub }]}>Sotilgandan keyin:</Text>
                      <Text style={[styles.previewValue, {
                        color: Number(selectedProduct.stock) - qty >= 0 ? '#059669' : '#EF4444',
                        fontWeight: '800',
                      }]}>
                        {Number(selectedProduct.stock) - qty} {selectedProduct.unit}
                      </Text>
                    </View>
                  )}
                </View>
              )}
              {qty > 0 && sale > 0 && (
                <View style={[styles.previewBox, { backgroundColor: dark ? '#0F2A1A' : '#F0FDF4', borderColor: '#86EFAC' }]}>
                  <View style={styles.previewRow}>
                    <Text style={[styles.previewLabel, { color: c.sub }]}>Jami sotuv:</Text>
                    <Text style={[styles.previewValue, { color: '#059669' }]}>{fmt(totalSale)}</Text>
                  </View>
                  {purchase > 0 && (
                    <View style={styles.previewRow}>
                      <Text style={[styles.previewLabel, { color: c.sub }]}>Foyda:</Text>
                      <Text style={[styles.previewValue, { color: profit >= 0 ? '#059669' : '#EF4444', fontWeight: '800' }]}>
                        {profit >= 0 ? '+' : ''}{fmt(profit)}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: c.sub }]}>Xaridor</Text>
                <View style={[styles.fieldBox, { backgroundColor: c.input, borderColor: c.border }]}>
                  <TextInput style={[styles.fieldInput, { color: c.text }]} value={form.customer} onChangeText={f('customer')} placeholder="Alisher Valiyev (ixtiyoriy)" placeholderTextColor={c.sub} />
                </View>
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

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: '#059669' }, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : (
                  <><Ionicons name="add" size={20} color="#fff" /><Text style={styles.saveBtnText}>Sotuv qo'shish</Text></>
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
            renderItem={({ item: p }) => {
              const stock = Number(p.stock);
              const outOfStock = stock === 0;
              return (
                <TouchableOpacity
                  style={[styles.pickerItem, { borderBottomColor: c.border }, outOfStock && { opacity: 0.45 }]}
                  onPress={() =>
                    outOfStock
                      ? Alert.alert('Stok tugagan', `${p.name} mahsuloti stokda yo'q`)
                      : selectProduct(p)
                  }
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pickerItemName, { color: c.text }]}>{p.name}</Text>
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 2 }}>
                      {p.purchasePrice ? (
                        <Text style={[styles.pickerItemSub, { color: c.sub }]}>
                          Keldi: {fmt(p.purchasePrice)}
                        </Text>
                      ) : null}
                      <Text style={[styles.pickerItemSub, { color: '#059669' }]}>
                        Sotish: {fmt(p.salePrice)}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.stockTag, {
                    backgroundColor: outOfStock ? '#FEE2E2' : stock <= p.lowStockLimit ? '#FEF3C7' : '#DCFCE7',
                    alignItems: 'center',
                  }]}>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: outOfStock ? '#DC2626' : stock <= p.lowStockLimit ? '#92400E' : '#166534' }}>
                      {outOfStock ? 'Tugagan' : 'Mavjud'}
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: outOfStock ? '#DC2626' : stock <= p.lowStockLimit ? '#D97706' : '#059669' }}>
                      {stock} {p.unit}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
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
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  productName: { fontSize: 15, fontWeight: '600' },
  metaText: { fontSize: 12, marginTop: 2 },
  itemActions: { alignItems: 'flex-end', gap: 6 },
  dateBadge: { fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  pricesRow: {
    flexDirection: 'row', borderRadius: 10, borderWidth: 1,
    marginBottom: 10, overflow: 'hidden',
  },
  priceCell: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  priceCellLabel: { fontSize: 9, fontWeight: '600', marginBottom: 2 },
  priceCellValue: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  priceDivider: { width: 1 },
  itemBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qty: { fontSize: 13 },
  total: { fontSize: 15, fontWeight: '800' },
  note: { fontSize: 12, marginTop: 6, fontStyle: 'italic' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15 },
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#059669', justifyContent: 'center', alignItems: 'center',
    elevation: 8, shadowColor: '#059669', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10,
  },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheetWrap: { justifyContent: 'flex-end', flex: 1 },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36, maxHeight: '92%',
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
  pickerText: { fontSize: 15 },
  previewBox: {
    borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 14, gap: 6,
  },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewLabel: { fontSize: 13 },
  previewValue: { fontSize: 15, fontWeight: '700' },
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
  pickerItemSub: { fontSize: 12 },
  stockTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  productImage: { width: 44, height: 44, borderRadius: 10 },
  labelRow: { flexDirection: 'row', marginBottom: 4 },
  soldBadge: { backgroundColor: '#05966920', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  soldBadgeText: { fontSize: 10, fontWeight: '700', color: '#059669' },
});
