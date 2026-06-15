import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, Modal, ScrollView, StyleSheet,
  Text, TouchableOpacity, View, useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth';

const DRAWER_WIDTH = Dimensions.get('window').width * 0.78;

const navGroups = [
  {
    label: 'UMUMIY',
    items: [
      { key: 'index', href: '/(tabs)', label: 'Bosh sahifa', icon: 'home' },
    ],
  },
  {
    label: 'OMBOR',
    items: [
      { key: 'mahsulotlar', href: '/(tabs)/mahsulotlar', label: 'Mahsulotlar', icon: 'cube-outline' },
      { key: 'kirim', href: '/(tabs)/kirim', label: 'Kirim', icon: 'arrow-down-circle-outline' },
      { key: 'sotuv', href: '/(tabs)/sotuv', label: 'Sotuv', icon: 'arrow-up-circle-outline' },
    ],
  },
  {
    label: 'MOLIYA',
    items: [
      { key: 'qarzdorlar', href: '/qarzdorlar', label: 'Qarzdorlar', icon: 'people-outline' },
      { key: 'taminotchilar', href: '/taminotchilar', label: "Ta'minotchilar", icon: 'cart-outline' },
      { key: 'xarajatlar', href: '/xarajatlar', label: 'Xarajatlar', icon: 'receipt-outline' },
    ],
  },
  {
    label: 'TAHLIL',
    items: [
      { key: 'hisobotlar', href: '/hisobotlar', label: 'Hisobotlar', icon: 'bar-chart-outline' },
    ],
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function DrawerMenu({ open, onClose }: Props) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const insets = useSafeAreaInsets();

  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      setModalVisible(true);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 70,
          friction: 12,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setModalVisible(false));
    }
  }, [open]);

  const navigate = (href: string) => {
    onClose();
    setTimeout(() => router.push(href as never), 60);
  };

  const isActive = (key: string) => {
    if (key === 'index') return pathname === '/' || pathname === '/(tabs)' || pathname.endsWith('/index');
    return pathname.includes(key);
  };

  const c = {
    bg: dark ? '#0F172A' : '#FFFFFF',
    headerBg: dark ? '#1E293B' : '#F8FAFC',
    text: dark ? '#F1F5F9' : '#0F172A',
    sub: dark ? '#64748B' : '#94A3B8',
    divider: dark ? '#1E293B' : '#F1F5F9',
    groupLabel: dark ? '#334155' : '#CBD5E1',
    itemHover: dark ? '#1E293B' : '#F8FAFC',
  };

  const initials = (user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '');

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Drawer panel slides from right */}
      <Animated.View
        style={[
          styles.drawer,
          {
            backgroundColor: c.bg,
            transform: [{ translateX: slideAnim }],
            paddingBottom: insets.bottom + 8,
          },
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: c.headerBg, paddingTop: insets.top + 10 }]}>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Ionicons name="storefront" size={18} color="#fff" />
            </View>
            <View>
              <Text style={[styles.logoTitle, { color: c.text }]}>Papash Market</Text>
              <Text style={[styles.logoSub, { color: c.sub }]}>Ombor va Savdo Tizimi</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={22} color={c.sub} />
          </TouchableOpacity>
        </View>

        {/* User row */}
        {user && (
          <View style={[styles.userRow, { borderBottomColor: c.divider }]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.userName, { color: c.text }]} numberOfLines={1}>
                {user.firstName} {user.lastName}
              </Text>
              <Text style={styles.userRole}>{user.role}</Text>
            </View>
          </View>
        )}

        {/* Nav items */}
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {navGroups.map((group) => (
            <View key={group.label} style={styles.group}>
              <Text style={[styles.groupLabel, { color: c.groupLabel }]}>{group.label}</Text>
              {group.items.map((item) => {
                const active = isActive(item.key);
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.navItem,
                      { backgroundColor: active ? '#4F46E5' : c.itemHover },
                    ]}
                    onPress={() => navigate(item.href)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={item.icon as never}
                      size={18}
                      color={active ? '#fff' : c.sub}
                    />
                    <Text style={[styles.navLabel, { color: active ? '#fff' : c.text }]}>
                      {item.label}
                    </Text>
                    {active && (
                      <View style={styles.activeDot} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </ScrollView>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, { borderTopColor: c.divider }]}
          onPress={async () => { onClose(); await logout(); }}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Chiqish</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  drawer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#4F46E5',
    justifyContent: 'center', alignItems: 'center',
  },
  logoTitle: { fontSize: 14, fontWeight: '700' },
  logoSub: { fontSize: 10, marginTop: 1 },
  userRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#4F46E520',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#4F46E5', fontWeight: '700', fontSize: 14 },
  userName: { fontSize: 13, fontWeight: '600' },
  userRole: { fontSize: 11, color: '#4F46E5', fontWeight: '500', marginTop: 1, textTransform: 'capitalize' },
  scroll: { flex: 1, paddingHorizontal: 10, paddingTop: 6 },
  group: { marginBottom: 18 },
  groupLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.2,
    paddingHorizontal: 8, marginBottom: 4, marginTop: 6,
  },
  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 11,
    borderRadius: 10, marginBottom: 2,
  },
  navLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  activeDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 22, paddingVertical: 14,
    borderTopWidth: 1, marginTop: 4,
  },
  logoutText: { color: '#EF4444', fontSize: 14, fontWeight: '600' },
});
