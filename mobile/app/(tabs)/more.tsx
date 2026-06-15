import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Alert, ScrollView, StyleSheet, Text,
  TouchableOpacity, useColorScheme, View,
} from 'react-native';
import { useAuth } from '@/lib/auth';

interface MenuItemProps {
  icon: string;
  label: string;
  sub: string;
  color: string;
  onPress: () => void;
  dark: boolean;
  c: { card: string; text: string; sub: string; border: string };
}

function MenuItem({ icon, label, sub, color, onPress, dark, c }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: c.card, borderColor: c.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as never} size={22} color={color} />
      </View>
      <View style={styles.menuInfo}>
        <Text style={[styles.menuLabel, { color: c.text }]}>{label}</Text>
        <Text style={[styles.menuSub, { color: c.sub }]}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={c.sub} />
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const { user, logout } = useAuth();
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  const c = {
    bg: dark ? '#0F172A' : '#F8FAFC',
    card: dark ? '#1E293B' : '#FFFFFF',
    text: dark ? '#F1F5F9' : '#0F172A',
    sub: dark ? '#94A3B8' : '#64748B',
    border: dark ? '#334155' : '#E2E8F0',
  };

  const handleLogout = () => {
    Alert.alert('Chiqish', 'Hisobdan chiqishni tasdiqlaysizmi?', [
      { text: 'Bekor', style: 'cancel' },
      { text: 'Chiqish', style: 'destructive', onPress: logout },
    ]);
  };

  const menuItems = [
    { icon: 'people-outline', label: 'Qarzdorlar', sub: "Qarz va to'lovlarni boshqarish", color: '#EF4444', route: '/qarzdorlar' },
    { icon: 'business-outline', label: "Ta'minotchilar", sub: "Yetkazib beruvchilar ro'yxati", color: '#F59E0B', route: '/taminotchilar' },
    { icon: 'receipt-outline', label: 'Xarajatlar', sub: 'Elektr, transport va boshqa', color: '#8B5CF6', route: '/xarajatlar' },
    { icon: 'bar-chart-outline', label: 'Hisobotlar', sub: "Savdo va foyda tahlili", color: '#0EA5E9', route: '/hisobotlar' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.bg }]} contentContainerStyle={styles.scroll}>
      {/* User card */}
      <View style={[styles.userCard, { backgroundColor: '#4F46E5' }]}>
        <View style={styles.userAvatar}>
          <Text style={styles.userInitials}>
            {(user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '')}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role}</Text>
          </View>
        </View>
      </View>

      {/* Menu items */}
      <Text style={[styles.section, { color: c.sub }]}>MODULLAR</Text>
      {menuItems.map((m) => (
        <MenuItem
          key={m.route}
          icon={m.icon}
          label={m.label}
          sub={m.sub}
          color={m.color}
          dark={dark}
          c={c}
          onPress={() => router.push(m.route as never)}
        />
      ))}

      {/* Logout */}
      <Text style={[styles.section, { color: c.sub }]}>HISOB</Text>
      <TouchableOpacity
        style={[styles.logoutBtn, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={styles.logoutText}>Hisobdan chiqish</Text>
      </TouchableOpacity>

      <Text style={[styles.version, { color: c.sub }]}>Papash Market v1.0 · NestJS + Expo</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 32 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 18, padding: 18, marginBottom: 24,
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  userAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  userInitials: { color: '#fff', fontSize: 18, fontWeight: '700' },
  userInfo: { flex: 1 },
  userName: { color: '#fff', fontSize: 17, fontWeight: '700' },
  userEmail: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  roleBadge: {
    alignSelf: 'flex-start', marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
  },
  roleText: { color: '#fff', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  section: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10, marginTop: 4 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  menuIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuInfo: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  menuSub: { fontSize: 12 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 24,
  },
  logoutText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
  version: { textAlign: 'center', fontSize: 12 },
});
