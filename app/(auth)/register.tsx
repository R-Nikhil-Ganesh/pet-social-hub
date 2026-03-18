import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { useAuthStore } from '@/store/authStore';

export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const [form, setForm] = useState({
    display_name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleRegister = async () => {
    setErrorText('');
    const { display_name, username, email, password, confirmPassword } = form;
    if (!display_name || !username || !email || !password) {
      setErrorText('All fields are required.');
      Alert.alert('Missing Fields', 'All fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorText('Passwords do not match.');
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setErrorText('Password must be at least 8 characters.');
      Alert.alert('Weak Password', 'Password must be at least 8 characters.');
      return;
    }
    const usernameRegex = /^[a-z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      setErrorText('Username must be 3-20 lowercase letters, numbers, or underscores.');
      Alert.alert(
        'Invalid Username',
        'Username must be 3–20 lowercase letters, numbers, or underscores.'
      );
      return;
    }
    setLoading(true);
    try {
      await register({
        display_name: display_name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password,
      });
      router.replace('/(tabs)/feed');
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (err?.code === 'ECONNABORTED' || err?.message?.includes('Network Error')
          ? 'Cannot reach server. Set EXPO_PUBLIC_API_URL to your backend URL and make sure the server is running.'
          : 'Please try again.');
      setErrorText(errorMessage);
      Alert.alert(
        'Registration Failed',
        errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  const fields: {
    key: keyof typeof form;
    label: string;
    placeholder: string;
    secure?: boolean;
    keyboard?: 'default' | 'email-address';
    autoCapitalize?: 'none' | 'words';
  }[] = [
    { key: 'display_name', label: 'Display Name', placeholder: 'Luna & Mochi', autoCapitalize: 'words' },
    { key: 'username', label: 'Username', placeholder: 'lunamochi', autoCapitalize: 'none' },
    { key: 'email', label: 'Email', placeholder: 'you@example.com', keyboard: 'email-address', autoCapitalize: 'none' },
    { key: 'password', label: 'Password', placeholder: '••••••••', secure: true, autoCapitalize: 'none' },
    { key: 'confirmPassword', label: 'Confirm Password', placeholder: '••••••••', secure: true, autoCapitalize: 'none' },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={['#F5F3FF', '#EDE9FE', '#fff']} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <ThemedText style={styles.logo}>🐾</ThemedText>
            <ThemedText style={styles.appName}>Join Pawprint</ThemedText>
            <ThemedText style={styles.tagline}>Your pet's social life starts here</ThemedText>
          </View>

          <View style={styles.form}>
            <ThemedText style={styles.heading}>Create account</ThemedText>

            {fields.map(({ key, label, placeholder, secure, keyboard, autoCapitalize }) => (
              <View key={key} style={styles.inputGroup}>
                <ThemedText style={styles.label}>{label}</ThemedText>
                <TextInput
                  style={styles.input}
                  value={form[key]}
                  onChangeText={(val) => updateField(key, val)}
                  placeholder={placeholder}
                  placeholderTextColor="#A1A1AA"
                  secureTextEntry={secure}
                  keyboardType={keyboard ?? 'default'}
                  autoCapitalize={autoCapitalize ?? 'none'}
                  returnKeyType="next"
                />
              </View>
            ))}

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.btnText}>Create Account</ThemedText>
              )}
            </TouchableOpacity>

            {errorText ? <ThemedText style={styles.errorText}>{errorText}</ThemedText> : null}

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => router.back()}
            >
              <ThemedText style={styles.secondaryText}>
                Already have an account?{' '}
                <ThemedText style={styles.linkText}>Sign in</ThemedText>
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 40 },
  hero: { alignItems: 'center', marginBottom: 28, gap: 6 },
  logo: { fontSize: 48 },
  appName: { fontSize: 28, fontWeight: '800', color: '#7C3AED', letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: '#71717A' },
  form: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    gap: 14,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  heading: { fontSize: 20, fontWeight: '800', color: '#18181B', marginBottom: 4 },
  inputGroup: { gap: 5 },
  label: { fontSize: 13, fontWeight: '600', color: '#52525B' },
  input: {
    borderWidth: 1.5,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    padding: 13,
    fontSize: 15,
    color: '#18181B',
    backgroundColor: '#FAFAFA',
  },
  btn: {
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  errorText: { color: '#DC2626', fontSize: 13, fontWeight: '600' },
  secondaryBtn: { alignItems: 'center', paddingVertical: 4 },
  secondaryText: { fontSize: 14, color: '#52525B' },
  linkText: { color: '#7C3AED', fontWeight: '700' },
});
