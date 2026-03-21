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

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  const handleLogin = async () => {
    setErrorText('');
    if (!email.trim() || !password.trim()) {
      setErrorText('Please enter your email and password.');
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(tabs)/feed');
    } catch (err: any) {
      const errorMessage =
        (err?.response?.status === 401
          ? 'Invalid email or password.'
          : '') ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (err?.code === 'ECONNABORTED' || err?.message?.includes('Network Error')
          ? 'Cannot reach server. Set EXPO_PUBLIC_API_URL to your backend URL and make sure the server is running.'
          : 'Check your credentials and try again.');
      setErrorText(errorMessage);
      Alert.alert(
        'Login Failed',
        errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={['#F5F3FF', '#EDE9FE', '#fff']} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / Hero */}
          <View style={styles.hero}>
            <ThemedText style={styles.logo}>🐾</ThemedText>
            <ThemedText style={styles.appName}>Pawprint</ThemedText>
            <ThemedText style={styles.tagline}>Where every pet is the star</ThemedText>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <ThemedText style={styles.heading}>Welcome back</ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Email</ThemedText>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#A1A1AA"
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Password</ThemedText>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#A1A1AA"
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.btnText}>Sign In</ThemedText>
              )}
            </TouchableOpacity>

            {errorText ? <ThemedText style={styles.errorText}>{errorText}</ThemedText> : null}

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => router.push('/(auth)/register')}
            >
              <ThemedText style={styles.secondaryText}>
                New here?{' '}
                <ThemedText style={styles.linkText}>Create an account</ThemedText>
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
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 40,
    gap: 6,
  },
  logo: {
    fontSize: 60,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#7C3AED',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: '#71717A',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    gap: 16,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#18181B',
    marginBottom: 4,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#52525B',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#18181B',
    backgroundColor: '#FAFAFA',
  },
  btn: {
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  secondaryText: {
    fontSize: 14,
    color: '#52525B',
  },
  linkText: {
    color: '#7C3AED',
    fontWeight: '700',
  },
});
