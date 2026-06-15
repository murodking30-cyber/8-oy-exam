import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import DrawerMenu from '@/components/DrawerMenu';

export default function TabLayout() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const [drawerOpen, setDrawerOpen] = useState(false);

  const headerBg = dark ? '#1E293B' : '#FFFFFF';
  const headerText = dark ? '#F1F5F9' : '#0F172A';
  const border = dark ? '#334155' : '#E2E8F0';

  const menuButton = () => (
    <TouchableOpacity
      onPress={() => setDrawerOpen(true)}
      style={{ marginRight: 16, padding: 4 }}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="menu" size={26} color={headerText} />
    </TouchableOpacity>
  );

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarStyle: { display: 'none' },
          headerStyle: { backgroundColor: headerBg },
          headerShadowVisible: false,
          headerTintColor: headerText,
          headerTitleStyle: { fontWeight: '700', fontSize: 17 },
          headerRight: menuButton,
          headerLeftContainerStyle: { paddingLeft: 4 },
          headerRightContainerStyle: { paddingRight: 4 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ headerTitle: 'Papash Market' }}
        />
        <Tabs.Screen
          name="mahsulotlar"
          options={{ headerTitle: 'Mahsulotlar' }}
        />
        <Tabs.Screen
          name="kirim"
          options={{ headerTitle: 'Kirim' }}
        />
        <Tabs.Screen
          name="sotuv"
          options={{ headerTitle: 'Sotuv' }}
        />
        <Tabs.Screen
          name="more"
          options={{ headerTitle: "Ko'proq", href: null }}
        />
      </Tabs>
      <DrawerMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
