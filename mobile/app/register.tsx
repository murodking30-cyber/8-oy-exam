import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth';

export default function RegisterScreen() {
  const { register } = useAuth();
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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

  const handleRegister = async () => {
    setError('');
    if (!fullName.trim()) return setError("F.I.O kiritilishi shart");
    if (!email.trim()) return setError('Email kiritilishi shart');
    if (!phone.trim()) return setError('Telefon raqam kiritilishi shart');
    if (password.length < 6) return setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
    if (password !== confirm) return setError("Parollar mos kelmaydi");

    setLoading(true);
    try {
      const { contact } = await register(fullName.trim(), email.trim(), phone.trim(), password);
      router.replace({ pathname: '/verify', params: { contact } } as never);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string | string[] } }; message?: string };
      console.log('[Register Error]', e.response?.data ?? e.message ?? err);
      const raw = e.response?.data?.message;
      const msg = Array.isArray(raw) ? raw[0] : raw;
      if (msg) {
        setError(msg);
      } else if (!e.response) {
        setError(`Serverga ulanib bo'lmadi (${e.message ?? 'Network Error'}). IP va portni tekshiring.`);
      } else {
        setError("Ro'yxatdan o'tishda xatolik yuz berdi");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputWrapStyle = (focused?: boolean) => [
    styles.inputWrap,
    { backgroundColor: c.input, borderColor: focused ? '#4F46E5' : c.border },
  ];

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
          <Text style={[styles.logoSub, { color: c.sub }]}>Yangi hisob yaratish</Text>
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.heading, { color: c.text }]}>Ro'yxatdan o'tish</Text>
          <Text style={[styles.subheading, { color: c.sub }]}>Ma'lumotlaringizni kiriting</Text>

          {/* F.I.O */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: c.sub }]}>F.I.O</Text>
            <View style={inputWrapStyle()}>
              <Ionicons name="person-outline" size={18} color={c.sub} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: c.text }]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Valiyev Ali Baxtiyorovich"
                placeholderTextColor={c.sub}
                autoCapitalize="words"
                editable={!loading}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: c.sub }]}>Email</Text>
            <View style={inputWrapStyle()}>
              <Ionicons name="mail-outline" size={18} color={c.sub} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: c.text }]}
                value={email}
                onChangeText={setEmail}
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

          {/* Phone */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: c.sub }]}>Telefon raqam</Text>
            <View style={inputWrapStyle()}>
              <Ionicons name="call-outline" size={18} color={c.sub} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: c.text }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="+998901234567"
                placeholderTextColor={c.sub}
                keyboardType="phone-pad"
                editable={!loading}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: c.sub }]}>Parol</Text>
            <View style={inputWrapStyle()}>
              <Ionicons name="lock-closed-outline" size={18} color={c.sub} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: c.text }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Kamida 6 ta belgi"
                placeholderTextColor={c.sub}
                secureTextEntry={!showPw}
                editable={!loading}
                returnKeyType="next"
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

          {/* Confirm password */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: c.sub }]}>Parolni tasdiqlash</Text>
            <View style={inputWrapStyle()}>
              <Ionicons name="shield-checkmark-outline" size={18} color={c.sub} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: c.text }]}
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Parolni qayta kiriting"
                placeholderTextColor={c.sub}
                secureTextEntry={!showConfirm}
                editable={!loading}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
              <TouchableOpacity
                onPress={() => setShowConfirm((v) => !v)}
                style={styles.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={c.sub} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.btnText}>Ro'yxatdan o'tish</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Login link */}
        <View style={styles.loginRow}>
          <Text style={[styles.loginText, { color: c.sub }]}>Hisobingiz bormi? </Text>
          <TouchableOpacity onPress={() => router.push('/login')} activeOpacity={0.7}>
            <Text style={styles.loginLink}>Kirish</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 28 },
  logoCircle: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  logoTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  logoSub: { fontSize: 13, marginTop: 4 },
  card: {
    borderRadius: 20, padding: 24,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  heading: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  subheading: { fontSize: 13, marginBottom: 20 },
  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, paddingVertical: 12 },
  eyeBtn: { padding: 4 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    borderRadius: 10, padding: 12, marginBottom: 14,
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
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  loginText: { fontSize: 14 },
  loginLink: { fontSize: 14, fontWeight: '700', color: '#4F46E5' },
});
