import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth';

export default function LoginScreen() {
  const { login } = useAuth();
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const c = {
    bg: dark ? '#0F172A' : '#F8FAFC',
    card: dark ? '#1E293B' : '#FFFFFF',
    text: dark ? '#F1F5F9' : '#0F172A',
    sub: dark ? '#94A3B8' : '#64748B',
    border: dark ? '#334155' : '#E2E8F0',
    input: dark ? '#0F172A' : '#F8FAFC',
  };

  const handleLogin = async () => {
    const emailVal = email.trim();
    if (!emailVal) return setError('Email yoki telefon kiritilishi shart');
    if (!password) return setError('Parol kiritilishi shart');
    setLoading(true);
    setError('');
    try {
      await login(emailVal, password);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string | string[] } }; message?: string };
      console.log('[Login Error]', e.response?.data ?? e.message ?? err);
      const raw = e.response?.data?.message;
      const msg = Array.isArray(raw) ? raw[0] : (raw ?? '');

      if (msg) {
        setError(msg);
      } else if (!e.response) {
        setError(`Serverga ulanib bo'lmadi (${e.message ?? 'Network Error'})`);
      } else {
        setError("Email yoki parol noto'g'ri");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: c.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Ionicons name="storefront" size={32} color="#fff" />
          </View>
          <Text style={[styles.logoTitle, { color: c.text }]}>Papash Market</Text>
          <Text style={[styles.logoSub, { color: c.sub }]}>Ombor va Savdo Tizimi</Text>
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.heading, { color: c.text }]}>Xush kelibsiz</Text>
          <Text style={[styles.subheading, { color: c.sub }]}>Hisobingizga kiring</Text>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: c.sub }]}>Email yoki telefon</Text>
            <View style={[styles.inputWrap, { backgroundColor: c.input, borderColor: c.border }]}>
              <Ionicons name="mail-outline" size={18} color={c.sub} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: c.text }]}
                value={email}
                onChangeText={(v) => { setEmail(v); setError(''); }}
                placeholder="siz@email.com"
                placeholderTextColor={c.sub}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: c.sub }]}>Parol</Text>
            <View style={[styles.inputWrap, { backgroundColor: c.input, borderColor: c.border }]}>
              <Ionicons name="lock-closed-outline" size={18} color={c.sub} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: c.text }]}
                value={password}
                onChangeText={(v) => { setPassword(v); setError(''); }}
                placeholder="••••••••"
                placeholderTextColor={c.sub}
                secureTextEntry={!showPw}
                editable={!loading}
                onSubmitEditing={handleLogin}
                returnKeyType="done"
              />
              <TouchableOpacity
                onPress={() => setShowPw((v) => !v)}
                style={styles.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={c.sub} />
              </TouchableOpacity>
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.btnText}>Kirish</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Register link */}
        <View style={styles.registerRow}>
          <Text style={[styles.registerText, { color: c.sub }]}>Hisobingiz yo'qmi? </Text>
          <TouchableOpacity onPress={() => router.push('/register')} activeOpacity={0.7}>
            <Text style={styles.registerLink}>Ro'yxatdan o'ting</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.version, { color: c.sub }]}>Papash Market v1.0</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  logoTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  logoSub: { fontSize: 13, marginTop: 4 },
  card: {
    borderRadius: 20, padding: 24, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  subheading: { fontSize: 14, marginBottom: 24 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, paddingVertical: 13 },
  eyeBtn: { padding: 4 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    borderRadius: 10, padding: 12, marginBottom: 16,
  },
  errorText: { color: '#DC2626', fontSize: 13, flex: 1 },
  btn: {
    backgroundColor: '#4F46E5', borderRadius: 12, paddingVertical: 14,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    marginTop: 4,
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  registerText: { fontSize: 14 },
  registerLink: { fontSize: 14, fontWeight: '700', color: '#4F46E5' },
  version: { textAlign: 'center', fontSize: 12, marginTop: 8 },
});
