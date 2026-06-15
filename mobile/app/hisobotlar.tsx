import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, RefreshControl, ScrollView, StyleSheet,
  Text, TouchableOpacity, useColorScheme, View,
} from 'react-native';
import api from '@/lib/api';
import type { InventoryStats, PeriodStats } from '@/lib/types';

function fmt(n: number) { return n.toLocaleString('uz-UZ') + " so'm"; }
function pct(a: number, b: number) { return b > 0 ? ((a / b) * 100).toFixed(1) + '%' : '—'; }

type Period = 'today' | 'thisMonth' | 'thisYear';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Bugun' },
  { key: 'thisMonth', label: 'Bu oy' },
  { key: 'thisYear', label: 'Bu yil' },
];

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <View style={[styles.statCard, { borderColor: color + '40' }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as never} size={22} color={color} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

export default function HisobotlarScreen() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  const [data, setData] = useState<InventoryStats | null>(null);
  const [period, setPeriod] = useState<Period>('thisMonth');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const c = {
    bg: dark ? '#0F172A' : '#F8FAFC',
    card: dark ? '#1E293B' : '#FFFFFF',
    text: dark ? '#F1F5F9' : '#0F172A',
    sub: dark ? '#94A3B8' : '#64748B',
    border: dark ? '#334155' : '#E2E8F0',
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<InventoryStats>('/reports/inventory-stats');
      setData(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const s: PeriodStats | null = data ? data[period] : null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.bg }]}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#0EA5E9" />}
    >
      {/* Period selector */}
      <View style={styles.periodRow}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.key}
            onPress={() => setPeriod(p.key)}
            style={[styles.periodBtn, { borderColor: c.border }, period === p.key && { backgroundColor: '#0EA5E9', borderColor: '#0EA5E9' }]}
          >
            <Text style={[styles.periodText, { color: period === p.key ? '#fff' : c.sub }]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0EA5E9" style={{ marginTop: 60 }} />
      ) : s ? (
        <>
          {/* Main stats */}
          <Text style={[styles.sectionTitle, { color: c.sub }]}>SAVDO HISOBOTI</Text>
          <View style={styles.gridRow}>
            <StatCard label="Savdo" value={fmt(s.sales)} icon="trending-up-outline" color="#059669" />
            <StatCard label="Sof foyda" value={fmt(s.profit)} icon="cash-outline" color="#0EA5E9" />
          </View>
          <View style={styles.gridRow}>
            <StatCard label="Sotildi (miqdor)" value={String(s.soldQuantity)} icon="bag-outline" color="#8B5CF6" />
            <StatCard label="Xarajatlar" value={fmt(s.expenses)} icon="receipt-outline" color="#EF4444" />
          </View>

          {/* Profit breakdown */}
          <Text style={[styles.sectionTitle, { color: c.sub }]}>FOYDA TAHLILI</Text>
          <View style={[styles.profitCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={styles.profitRow}>
              <Text style={[styles.profitLabel, { color: c.sub }]}>Savdo summasi</Text>
              <Text style={[styles.profitValue, { color: c.text }]}>{fmt(s.sales)}</Text>
            </View>
            <View style={styles.profitRow}>
              <Text style={[styles.profitLabel, { color: c.sub }]}>Xarid narxi</Text>
              <Text style={[styles.profitValue, { color: '#EF4444' }]}>- {fmt(s.purchases)}</Text>
            </View>
            <View style={styles.profitRow}>
              <Text style={[styles.profitLabel, { color: c.sub }]}>Xarajatlar</Text>
              <Text style={[styles.profitValue, { color: '#EF4444' }]}>- {fmt(s.expenses)}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: c.border }]} />
            <View style={styles.profitRow}>
              <Text style={[styles.profitLabelBold, { color: c.text }]}>Sof foyda</Text>
              <Text style={[styles.profitLabelBold, { color: s.profit >= 0 ? '#059669' : '#EF4444' }]}>
                {fmt(s.profit)}
              </Text>
            </View>
            <View style={[styles.marginBadge, { backgroundColor: s.profit >= 0 ? '#DCFCE7' : '#FEE2E2' }]}>
              <Text style={[styles.marginText, { color: s.profit >= 0 ? '#166534' : '#DC2626' }]}>
                Marja: {pct(s.profit, s.sales)}
              </Text>
            </View>
          </View>

          {/* Top products */}
          {data && data.topProducts.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: c.sub }]}>TOP MAHSULOTLAR (bu oy)</Text>
              <View style={[styles.profitCard, { backgroundColor: c.card, borderColor: c.border }]}>
                {data.topProducts.map((p, i) => (
                  <View key={p.productId}>
                    <View style={styles.topRow}>
                      <View style={[styles.rank, { backgroundColor: i === 0 ? '#FEF3C7' : '#F1F5F9' }]}>
                        <Text style={[styles.rankText, { color: i === 0 ? '#92400E' : '#64748B' }]}>{i + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.topName, { color: c.text }]} numberOfLines={1}>{p.productName}</Text>
                        <Text style={[styles.topQty, { color: c.sub }]}>{Number(p.totalQuantity)} {p.unit ?? ''}</Text>
                      </View>
                      <Text style={[styles.topAmt, { color: '#059669' }]}>{fmt(Number(p.totalAmount))}</Text>
                    </View>
                    {i < data.topProducts.length - 1 && <View style={[styles.divider, { backgroundColor: c.border }]} />}
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Inventory summary */}
          {data && (
            <>
              <Text style={[styles.sectionTitle, { color: c.sub }]}>INVENTAR</Text>
              <View style={styles.gridRow}>
                <StatCard label="Mahsulotlar" value={String(data.totalProducts)} icon="cube-outline" color="#4F46E5" />
                <StatCard label="Ombor qiymati" value={fmt(data.totalStockValue)} icon="server-outline" color="#F59E0B" />
              </View>
            </>
          )}
        </>
      ) : (
        <View style={styles.empty}>
          <Ionicons name="bar-chart-outline" size={56} color={c.sub} />
          <Text style={[styles.emptyText, { color: c.sub }]}>Ma'lumotlar yuklanmadi</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 12, paddingBottom: 32 },
  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  periodBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5,
    alignItems: 'center',
  },
  periodText: { fontSize: 13, fontWeight: '700' },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10, marginTop: 4 },
  gridRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1, borderRadius: 16, borderWidth: 1.5, padding: 14,
  },
  statIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statLabel: { fontSize: 11, fontWeight: '600', color: '#64748B', marginBottom: 4 },
  statValue: { fontSize: 15, fontWeight: '800' },
  profitCard: {
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  profitRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  profitLabel: { fontSize: 14 },
  profitLabelBold: { fontSize: 15, fontWeight: '800' },
  profitValue: { fontSize: 14, fontWeight: '600' },
  divider: { height: 1, marginVertical: 4 },
  marginBadge: { borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, alignSelf: 'flex-start', marginTop: 8 },
  marginText: { fontSize: 12, fontWeight: '700' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  rank: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  rankText: { fontSize: 13, fontWeight: '700' },
  topName: { fontSize: 14, fontWeight: '600' },
  topQty: { fontSize: 12, marginTop: 1 },
  topAmt: { fontSize: 14, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15 },
});
