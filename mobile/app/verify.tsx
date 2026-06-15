import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/lib/auth';

export default function VerifyScreen() {
  const { verify, resendCode } = useAuth();
  const params = useLocalSearchParams();
  const contact = (params.contact as string) ?? '';

  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputRef = useRef<TextInput>(null);

  const c = {
    bg: dark ? '#0F172A' : '#F8FAFC',
    card: dark ? '#1E293B' : '#FFFFFF',
    text: dark ? '#F1F5F9' : '#0F172A',
    sub: dark ? '#94A3B8' : '#64748B',
    border: dark ? '#334155' : '#E2E8F0',
    input: dark ? '#0F172A' : '#F8FAFC',
  };

  const handleVerify = async () => {
    setError('');
    const trimmedCode = code.trim();
    if (!trimmedCode) return setError('Tasdiqlash kodi kiritilishi shart');
    if (trimmedCode.length !== 6) return setError("Kod 6 ta raqamdan iborat bo'lishi kerak");
    if (!contact) return setError("Email topilmadi. Qaytadan ro'yxatdan o'ting.");

    setLoading(true);
    try {
      await verify(contact, trimmedCode);
      // on success, auth.tsx calls router.replace('/(tabs)')
    } catch (err: unknown) {
      const raw = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const msg = Array.isArray(raw) ? raw[0] : raw;
      setError(msg ?? "Kod noto'g'ri yoki muddati tugagan");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!contact) return;
    setError('');
    setSuccess('');
    setResending(true);
    try {
      await resendCode(contact);
      setSuccess("Yangi kod yuborildi. Serverda konsolni tekshiring (email sozlanmagan bo'lsa)");
      setCode('');
    } catch (err: unknown) {
      const raw = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const msg = Array.isArray(raw) ? raw[0] : raw;
      setError(msg ?? 'Kodni qayta yuborishda xatolik');
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: c.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Icon */}
        <View style={styles.iconWrap}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail-open-outline" size={36} color="#fff" />
          </View>
          <Text style={[styles.heading, { color: c.text }]}>Emailni tasdiqlang</Text>
          {contact ? (
            <Text style={[styles.emailText, { color: '#4F46E5' }]} numberOfLines={1}>{contact}</Text>
          ) : null}
        </View>

        {/* Info box */}
        <View style={[styles.infoBox, { backgroundColor: dark ? '#1E3A5F' : '#EFF6FF', borderColor: dark ? '#2563EB40' : '#BFDBFE' }]}>
          <Ionicons name="information-circle-outline" size={18} color="#3B82F6" />
          <Text style={[styles.infoText, { color: dark ? '#93C5FD' : '#1D4ED8' }]}>
            Tasdiqlash kodi backend serverda konsolga chiqarilgan.{'\n'}
            <Text style={{ fontWeight: '700' }}>Terminal → "Tasdiqlash kodi: XXXXXX"</Text>
          </Text>
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.label, { color: c.sub }]}>6 xonali tasdiqlash kodi</Text>

          {/* Code input */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => inputRef.current?.focus()}
            style={[styles.codeInputWrap, { backgroundColor: c.input, borderColor: code.length > 0 ? '#4F46E5' : c.border }]}
          >
            <Ionicons name="keypad-outline" size={20} color={c.sub} style={{ marginRight: 12 }} />
            <TextInput
              ref={inputRef}
              style={[styles.codeInput, { color: c.text, letterSpacing: code.length > 0 ? 6 : 0 }]}
              value={code}
              onChangeText={(v) => {
                setCode(v.replace(/\D/g, '').slice(0, 6));
                setError('');
              }}
              placeholder="• • • • • •"
              placeholderTextColor={c.sub}
              keyboardType="number-pad"
              maxLength={6}
              editable={!loading}
              onSubmitEditing={handleVerify}
              returnKeyType="done"
              autoFocus
            />
            {code.length === 6 && (
              <Ionicons name="checkmark-circle" size={20} color="#059669" />
            )}
          </TouchableOpacity>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {success ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#059669" />
              <Text style={styles.successText}>{success}</Text>
            </View>
          ) : null}

          {/* Verify button */}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleVerify}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.btnText}>Tasdiqlash</Text>
                <Ionicons name="shield-checkmark-outline" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          {/* Resend */}
          <TouchableOpacity
            style={[styles.resendBtn, { borderColor: c.border }, (resending || loading) && styles.btnDisabled]}
            onPress={handleResend}
            disabled={resending || loading}
            activeOpacity={0.7}
          >
            {resending ? (
              <ActivityIndicator size="small" color="#4F46E5" />
            ) : (
              <>
                <Ionicons name="refresh-outline" size={16} color="#4F46E5" />
                <Text style={styles.resendText}>Kodni qayta yuborish</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Back */}
        <TouchableOpacity
          style={styles.backRow}
          onPress={() => router.replace('/login')}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back-outline" size={16} color={c.sub} />
          <Text style={[styles.backText, { color: c.sub }]}>Kirish sahifasiga qaytish</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  iconWrap: { alignItems: 'center', marginBottom: 16 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  heading: { fontSize: 22, fontWeight: '800', marginBottom: 4, textAlign: 'center' },
  emailText: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  infoBox: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 16,
  },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
  card: {
    borderRadius: 20, padding: 24, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 10 },
  codeInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 4,
    marginBottom: 16,
  },
  codeInput: { flex: 1, fontSize: 24, fontWeight: '800', paddingVertical: 14, textAlign: 'center' },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    borderRadius: 10, padding: 12, marginBottom: 14,
  },
  errorText: { color: '#DC2626', fontSize: 13, flex: 1 },
  successBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0',
    borderRadius: 10, padding: 12, marginBottom: 14,
  },
  successText: { color: '#059669', fontSize: 13, flex: 1 },
  btn: {
    backgroundColor: '#4F46E5', borderRadius: 12, paddingVertical: 14,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
    marginBottom: 12,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  resendBtn: {
    borderRadius: 12, paddingVertical: 12, borderWidth: 1,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  resendText: { color: '#4F46E5', fontSize: 14, fontWeight: '600' },
  backRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 6, marginTop: 20,
  },
  backText: { fontSize: 14 },
});
