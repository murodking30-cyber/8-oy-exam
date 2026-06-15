import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Modal,
  Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, useColorScheme, View,
} from 'react-native';
import api, { BASE_URL } from '@/lib/api';
import type { Product } from '@/lib/types';

function fmt(n: number) { return n.toLocaleString('uz-UZ'); }

const UNITS = ['kg', 'tonna', 'qop'];
const IMAGE_BASE = BASE_URL.replace('/api', '');

interface Form {
  name: string;
  salePrice: string;
  purchasePrice: string;
  unit: string;
  stock: string;
  lowStockLimit: string;
  image: string;
}

const emptyForm = (): Form => ({
  name: '', salePrice: '', purchasePrice: '', unit: 'kg', stock: '0', lowStockLimit: '5', image: '',
});

export default function MahsulotlarScreen() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');

  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [form, setForm] = useState<Form>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');
  const [unitPickerOpen, setUnitPickerOpen] = useState(false);

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
      const res = await api.get<Product[]>('/products');
      setProducts(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || (p.category?.name ?? '').toLowerCase().includes(q);
    if (filter === 'low') return matchSearch && Number(p.stock) <= p.lowStockLimit && Number(p.stock) > 0;
    if (filter === 'out') return matchSearch && Number(p.stock) === 0;
    return matchSearch;
  });

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm());
    setFormError('');
    setModalVisible(true);
  };

  const openEdit = (p: Product) => {
    setEditTarget(p);
    setForm({
      name: p.name,
      salePrice: String(p.salePrice),
      purchasePrice: String(p.purchasePrice ?? ''),
      unit: p.unit,
      stock: String(p.stock),
      lowStockLimit: String(p.lowStockLimit),
      image: p.image ?? '',
    });
    setFormError('');
    setModalVisible(true);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Ruxsat kerak', "Galereyaga kirish uchun ruxsat bering (Sozlamalar → Ruxsatlar)");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: asset.fileName ?? 'photo.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      } as never);

      const res = await api.post<{ url: string }>('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((prev) => ({ ...prev, image: res.data.url }));
    } catch {
      Alert.alert('Xatolik', "Rasm yuklashda xatolik yuz berdi");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (p: Product) => {
    Alert.alert("O'chirish", `"${p.name}" mahsulotini o'chirasizmi?`, [
      { text: 'Bekor', style: 'cancel' },
      {
        text: "O'chirish", style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/products/${p.id}`);
            setProducts((prev) => prev.filter((x) => x.id !== p.id));
          } catch (e: unknown) {
            const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
            Alert.alert('Xatolik', msg ?? "O'chirishda xatolik");
          }
        },
      },
    ]);
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.name.trim()) return setFormError('Mahsulot nomi kiritilishi shart');
    if (!form.salePrice || Number(form.salePrice) < 0) return setFormError('Sotuv narxi kiritilishi shart');

    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        salePrice: Number(form.salePrice),
        purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined,
        unit: form.unit,
        stock: form.stock ? Number(form.stock) : 0,
        lowStockLimit: form.lowStockLimit ? Number(form.lowStockLimit) : 5,
        image: form.image || undefined,
      };
      if (editTarget) {
        const res = await api.patch<Product>(`/products/${editTarget.id}`, body);
        setProducts((prev) => prev.map((p) => p.id === editTarget.id ? res.data : p));
      } else {
        const res = await api.post<Product>('/products', body);
        setProducts((prev) => [res.data, ...prev]);
      }
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

  const renderItem = ({ item: p }: { item: Product }) => {
    const stock = Number(p.stock);
    const isOut = stock === 0;
    const isLow = stock > 0 && stock <= p.lowStockLimit;
    const badgeColor = isOut ? '#FEE2E2' : isLow ? '#FEF3C7' : '#DCFCE7';
    const badgeText = isOut ? '#DC2626' : isLow ? '#92400E' : '#166534';
    const imageUrl = p.image ? (p.image.startsWith('http') ? p.image : `${IMAGE_BASE}${p.image}`) : null;

    return (
      <TouchableOpacity
        style={[styles.item, { backgroundColor: c.card, borderColor: c.border }]}
        onPress={() => openEdit(p)}
        activeOpacity={0.75}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.productImage} />
        ) : (
          <View style={[styles.iconBox, { backgroundColor: '#4F46E520' }]}>
            <Ionicons name="cube-outline" size={20} color="#4F46E5" />
          </View>
        )}
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: c.text }]} numberOfLines={1}>{p.name}</Text>
          {p.category && <Text style={[styles.itemCat, { color: c.sub }]}>{p.category.name}</Text>}
          <View style={styles.priceRow}>
            {p.purchasePrice ? (
              <Text style={[styles.priceTag, { color: c.sub }]}>
                Keldi: {fmt(p.purchasePrice)}
              </Text>
            ) : null}
            <Text style={[styles.priceTag, { color: '#4F46E5', fontWeight: '700' }]}>
              Sotish: {fmt(p.salePrice)} so'm
            </Text>
          </View>
        </View>
        <View style={styles.itemRight}>
          <View style={[styles.stockBadge, { backgroundColor: badgeColor }]}>
            <Text style={[styles.stockText, { color: badgeText }]}>{stock} {p.unit}</Text>
          </View>
          <TouchableOpacity
            onPress={() => handleDelete(p)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ marginTop: 6 }}
          >
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={[styles.searchWrap, { backgroundColor: c.input, borderColor: c.border }]}>
        <Ionicons name="search-outline" size={18} color={c.sub} />
        <TextInput
          style={[styles.searchInput, { color: c.text }]}
          placeholder="Qidirish..."
          placeholderTextColor={c.sub}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={c.sub} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        {([
          { key: 'all', label: 'Barchasi' },
          { key: 'low', label: 'Kam qolgan' },
          { key: 'out', label: 'Tugagan' },
        ] as { key: 'all' | 'low' | 'out'; label: string }[]).map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            onPress={() => setFilter(key)}
            style={[styles.filterBtn, filter === key && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, filter === key && styles.filterTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#4F46E5" />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="cube-outline" size={48} color={c.sub} />
              <Text style={[styles.emptyText, { color: c.sub }]}>Mahsulotlar topilmadi</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={openAdd} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setModalVisible(false)} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.sheetWrap}>
          <View style={[styles.sheet, { backgroundColor: c.modal }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: c.text }]}>
                {editTarget ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={c.sub} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Image picker */}
              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: c.sub }]}>Mahsulot rasmi</Text>
                <TouchableOpacity
                  style={[styles.imagePicker, { borderColor: c.border, backgroundColor: c.input }]}
                  onPress={pickImage}
                  disabled={uploading}
                  activeOpacity={0.7}
                >
                  {uploading ? (
                    <ActivityIndicator color="#4F46E5" />
                  ) : form.image ? (
                    <Image
                      source={{ uri: form.image.startsWith('http') ? form.image : `${IMAGE_BASE}${form.image}` }}
                      style={styles.imagePreview}
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="image-outline" size={28} color={c.sub} />
                      <Text style={[styles.imagePlaceholderText, { color: c.sub }]}>Rasm tanlang</Text>
                    </View>
                  )}
                  {form.image && !uploading && (
                    <View style={styles.imageEditBadge}>
                      <Ionicons name="camera" size={14} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: c.sub }]}>Mahsulot nomi *</Text>
                <View style={[styles.fieldBox, { backgroundColor: c.input, borderColor: c.border }]}>
                  <TextInput style={[styles.fieldInput, { color: c.text }]} value={form.name} onChangeText={f('name')} placeholder="Sement M400" placeholderTextColor={c.sub} />
                </View>
              </View>

              <View style={styles.row2}>
                <View style={[styles.fieldWrap, { flex: 1 }]}>
                  <Text style={[styles.fieldLabel, { color: c.sub }]}>Kelgan narx</Text>
                  <View style={[styles.fieldBox, { backgroundColor: c.input, borderColor: c.border }]}>
                    <TextInput style={[styles.fieldInput, { color: c.text }]} value={form.purchasePrice} onChangeText={f('purchasePrice')} placeholder="45000" keyboardType="numeric" placeholderTextColor={c.sub} />
                  </View>
                </View>
                <View style={[styles.fieldWrap, { flex: 1 }]}>
                  <Text style={[styles.fieldLabel, { color: c.sub }]}>Sotuv narxi *</Text>
                  <View style={[styles.fieldBox, { backgroundColor: c.input, borderColor: c.border }]}>
                    <TextInput style={[styles.fieldInput, { color: c.text }]} value={form.salePrice} onChangeText={f('salePrice')} placeholder="50000" keyboardType="numeric" placeholderTextColor={c.sub} />
                  </View>
                </View>
              </View>

              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: c.sub }]}>O'lchov birligi</Text>
                <TouchableOpacity
                  style={[styles.fieldBox, { backgroundColor: c.input, borderColor: c.border }]}
                  onPress={() => setUnitPickerOpen(true)}
                >
                  <View style={[styles.pickerRow, { paddingVertical: 13 }]}>
                    <Text style={[styles.fieldInput, { color: c.text, paddingVertical: 0 }]}>{form.unit}</Text>
                    <Ionicons name="chevron-down" size={16} color={c.sub} />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.row2}>
                <View style={[styles.fieldWrap, { flex: 1 }]}>
                  <Text style={[styles.fieldLabel, { color: c.sub }]}>Mavjud stok</Text>
                  <View style={[styles.fieldBox, { backgroundColor: c.input, borderColor: c.border }]}>
                    <TextInput style={[styles.fieldInput, { color: c.text }]} value={form.stock} onChangeText={f('stock')} keyboardType="numeric" placeholderTextColor={c.sub} />
                  </View>
                </View>
                <View style={[styles.fieldWrap, { flex: 1 }]}>
                  <Text style={[styles.fieldLabel, { color: c.sub }]}>Minimal stok</Text>
                  <View style={[styles.fieldBox, { backgroundColor: c.input, borderColor: c.border }]}>
                    <TextInput style={[styles.fieldInput, { color: c.text }]} value={form.lowStockLimit} onChangeText={f('lowStockLimit')} keyboardType="numeric" placeholderTextColor={c.sub} />
                  </View>
                </View>
              </View>

              {formError ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                  <Text style={styles.errorText}>{formError}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.saveBtn, (saving || uploading) && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving || uploading}
              >
                {saving ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Ionicons name={editTarget ? 'checkmark' : 'add'} size={20} color="#fff" />
                    <Text style={styles.saveBtnText}>{editTarget ? 'Saqlash' : "Qo'shish"}</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Unit picker */}
      <Modal visible={unitPickerOpen} transparent animationType="fade" onRequestClose={() => setUnitPickerOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setUnitPickerOpen(false)} />
        <View style={[styles.unitPicker, { backgroundColor: c.modal }]}>
          <Text style={[styles.sheetTitle, { color: c.text, marginBottom: 12 }]}>O'lchov birligini tanlang</Text>
          {UNITS.map((u) => (
            <TouchableOpacity
              key={u}
              style={[styles.unitItem, form.unit === u && { backgroundColor: '#4F46E520' }]}
              onPress={() => { setForm((p) => ({ ...p, unit: u })); setUnitPickerOpen(false); }}
            >
              <Text style={[styles.unitText, { color: c.text }, form.unit === u && { color: '#4F46E5', fontWeight: '700' }]}>{u}</Text>
              {form.unit === u && <Ionicons name="checkmark" size={18} color="#4F46E5" />}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 12, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 11 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, marginBottom: 8 },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: 'transparent', borderWidth: 1, borderColor: '#E2E8F0',
  },
  filterBtnActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  filterTextActive: { color: '#fff' },
  list: { padding: 12, paddingTop: 4, paddingBottom: 100 },
  item: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderRadius: 14, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, gap: 10,
  },
  productImage: { width: 48, height: 48, borderRadius: 10 },
  iconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  itemCat: { fontSize: 11, marginBottom: 4 },
  priceRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  priceTag: { fontSize: 12 },
  itemRight: { alignItems: 'flex-end' },
  stockBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  stockText: { fontSize: 12, fontWeight: '700' },
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
  pickerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  imagePicker: {
    height: 100, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  imagePreview: { width: '100%', height: '100%' },
  imagePlaceholder: { alignItems: 'center', gap: 6 },
  imagePlaceholderText: { fontSize: 13 },
  imageEditBadge: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: '#4F46E5', borderRadius: 12,
    padding: 4,
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, marginBottom: 14,
  },
  errorText: { color: '#DC2626', fontSize: 13, flex: 1 },
  saveBtn: {
    backgroundColor: '#4F46E5', borderRadius: 14, paddingVertical: 15,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  unitPicker: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 40,
  },
  unitItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 8, borderRadius: 10, marginBottom: 2,
  },
  unitText: { fontSize: 16 },
});
