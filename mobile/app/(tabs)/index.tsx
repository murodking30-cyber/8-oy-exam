import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, RefreshControl, ScrollView,
  StyleSheet, Text, TouchableOpacity, useColorScheme, View,
} from 'react-native';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import type { InventoryStats } from '@/lib/types';

function fmt(n: number) {
  return n.toLocaleString('uz-UZ') + " so'm";
}

function StatCard({
  label, value, icon, gradient,
}: {
  label: string; value: string; icon: string; gradient: [string, string];
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: gradient[0] }]}>
      <View style={styles.statIconWrap}>
        <Ionicons name={icon as never} size={22} color="#fff" />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get<InventoryStats>('/reports/inventory-stats');
      setStats(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const c = {
    bg: dark ? '#0F172A' : '#F8FAFC',
    card: dark ? '#1E293B' : '#FFFFFF',
    text: dark ? '#F1F5F9' : '#0F172A',
    sub: dark ? '#94A3B8' : '#64748B',
    border: dark ? '#334155' : '#E2E8F0',
    warn: dark ? '#7C3AED20' : '#FEF3C7',
    warnText: dark ? '#A78BFA' : '#92400E',
  };

  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#4F46E5" />}
    >
      {/* Greeting */}
      <View style={styles.greetRow}>
        <View>
          <Text style={[styles.greetSub, { color: c.sub }]}>Assalomu alaykum,</Text>
          <Text style={[styles.greetName, { color: c.text }]}>{user?.firstName} {user?.lastName} 👋</Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: '#4F46E520' }]}>
          <Text style={[styles.roleText, { color: '#4F46E5' }]}>{user?.role}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 60 }} />
      ) : (
        <>
          {/* Today section */}
          <Text style={[styles.sectionTitle, { color: c.sub }]}>BUGUNGI KO'RSATKICHLAR</Text>
          <View style={styles.statGrid}>
            <StatCard
              label="Bugungi savdo"
              value={fmt(stats?.today.sales ?? 0)}
              icon="trending-up"
              gradient={['#4F46E5', '#6366F1']}
            />
            <StatCard
              label="Bugungi foyda"
              value={fmt(stats?.today.profit ?? 0)}
              icon="wallet"
              gradient={['#059669', '#10B981']}
            />
          </View>

          {/* Monthly section */}
          <Text style={[styles.sectionTitle, { color: c.sub }]}>OYLIK KO'RSATKICHLAR</Text>
          <View style={styles.statGrid}>
            <StatCard
              label="Oylik savdo"
              value={fmt(stats?.thisMonth.sales ?? 0)}
              icon="bar-chart"
              gradient={['#0EA5E9', '#38BDF8']}
            />
            <StatCard
              label="Oylik foyda"
              value={fmt(stats?.thisMonth.profit ?? 0)}
              icon="cash"
              gradient={['#F59E0B', '#FBBF24']}
            />
          </View>

          {/* Yearly */}
          <View style={styles.statGrid}>
            <StatCard
              label="Yillik savdo"
              value={fmt(stats?.thisYear.sales ?? 0)}
              icon="calendar"
              gradient={['#8B5CF6', '#A78BFA']}
            />
            <StatCard
              label="Jami xarajat"
              value={fmt(stats?.thisMonth.expenses ?? 0)}
              icon="receipt"
              gradient={['#EF4444', '#F87171']}
            />
          </View>

          {/* Summary row */}
          <View style={[styles.summaryRow, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={styles.summaryItem}>
              <Ionicons name="cube-outline" size={20} color="#4F46E5" />
              <Text style={[styles.summaryVal, { color: c.text }]}>{stats?.totalProducts ?? 0}</Text>
              <Text style={[styles.summaryLbl, { color: c.sub }]}>Mahsulot</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: c.border }]} />
            <View style={styles.summaryItem}>
              <Ionicons name="layers-outline" size={20} color="#10B981" />
              <Text style={[styles.summaryVal, { color: c.text }]}>{fmt(stats?.totalStockValue ?? 0)}</Text>
              <Text style={[styles.summaryLbl, { color: c.sub }]}>Ombor qiymati</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: c.border }]} />
            <View style={styles.summaryItem}>
              <Ionicons name="trending-up-outline" size={20} color="#F59E0B" />
              <Text style={[styles.summaryVal, { color: c.text }]}>{stats?.today.soldQuantity ?? 0}</Text>
              <Text style={[styles.summaryLbl, { color: c.sub }]}>Bugun sotildi</Text>
            </View>
          </View>

          {/* Low stock */}
          {(stats?.lowStock?.length ?? 0) > 0 && (
            <View>
              <Text style={[styles.sectionTitle, { color: c.sub }]}>KAM QOLGAN MAHSULOTLAR</Text>
              <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
                {stats!.lowStock.map((item, i) => (
                  <View key={item.id}>
                    {i > 0 && <View style={[styles.divider, { backgroundColor: c.border }]} />}
                    <View style={styles.lowStockRow}>
                      <View style={styles.lowStockLeft}>
                        <Ionicons name="warning-outline" size={16} color="#F59E0B" />
                        <Text style={[styles.lowStockName, { color: c.text }]} numberOfLines={1}>{item.name}</Text>
                      </View>
                      <View style={[styles.stockBadge, { backgroundColor: item.stock === 0 ? '#FEE2E2' : '#FEF3C7' }]}>
                        <Text style={[styles.stockBadgeText, { color: item.stock === 0 ? '#DC2626' : '#92400E' }]}>
                          {Number(item.stock)} {item.unit}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Top products */}
          {(stats?.topProducts?.length ?? 0) > 0 && (
            <View>
              <Text style={[styles.sectionTitle, { color: c.sub }]}>TOP MAHSULOTLAR (BU OY)</Text>
              <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
                {stats!.topProducts.slice(0, 5).map((p, i) => (
                  <View key={p.productId}>
                    {i > 0 && <View style={[styles.divider, { backgroundColor: c.border }]} />}
                    <View style={styles.topRow}>
                      <View style={[styles.medal, { backgroundColor: i === 0 ? '#FEF3C720' : '#F1F5F920' }]}>
                        <Text style={styles.medalText}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</Text>
                      </View>
                      <Text style={[styles.topName, { color: c.text }]} numberOfLines={1}>{p.productName}</Text>
                      <Text style={[styles.topAmt, { color: '#4F46E5' }]}>{fmt(Number(p.totalAmount))}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32 },
  greetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greetSub: { fontSize: 13 },
  greetName: { fontSize: 20, fontWeight: '700', marginTop: 2 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  roleText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10, marginTop: 4 },
  statGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  statIconWrap: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  statValue: { color: '#fff', fontSize: 17, fontWeight: '800', marginBottom: 4 },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '500' },
  summaryRow: {
    flexDirection: 'row', borderRadius: 16, borderWidth: 1,
    padding: 16, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  summaryDivider: { width: 1, marginHorizontal: 8 },
  summaryVal: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  summaryLbl: { fontSize: 10, fontWeight: '500', textAlign: 'center' },
  card: {
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, marginBottom: 20,
  },
  divider: { height: 1, marginHorizontal: 16 },
  lowStockRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  lowStockLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  lowStockName: { fontSize: 14, fontWeight: '500', flex: 1 },
  stockBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  stockBadgeText: { fontSize: 12, fontWeight: '700' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  medal: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  medalText: { fontSize: 16 },
  topName: { flex: 1, fontSize: 14, fontWeight: '500' },
  topAmt: { fontSize: 13, fontWeight: '700' },
});
