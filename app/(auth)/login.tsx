import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { AnimatedEntrance } from '@/components/ui/AnimatedEntrance';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import { API_BASE_URL } from '@/services/api';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL || '';

const stringifyForDebug = (value: unknown) => {
  if (value == null) return 'null';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const buildLoginDebugInfo = (err: any) => {
  const baseUrl = err?.config?.baseURL || `${API_BASE_URL}/api`;
  const path = err?.config?.url || '/auth/login';
  const requestUrl = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  return [
    `__DEV__: ${String(__DEV__)}`,
    `Platform: ${Platform.OS}`,
    `EXPO_PUBLIC_API_URL: ${configuredApiUrl || '(empty)'}`,
    `API_BASE_URL: ${API_BASE_URL}`,
    `Request URL: ${requestUrl}`,
    `HTTP Status: ${String(err?.response?.status ?? 'none')}`,
    `Axios Code: ${String(err?.code ?? 'none')}`,
    `Error Message: ${String(err?.message ?? 'none')}`,
    `Response Data: ${stringifyForDebug(err?.response?.data)}`,
  ].join('\n');
};

const testNetworkEndpoint = async (
  url: string
): Promise<{ ok: boolean; code: string; status?: number }> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, { method: 'GET', signal: controller.signal });
    clearTimeout(timeoutId);
    return { ok: true, code: 'OK', status: response.status };
  } catch (err: any) {
    return { ok: false, code: err?.code || err?.name || 'UNKNOWN', status: undefined };
  }
};

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [debugText, setDebugText] = useState('');
  const [networkTestResults, setNetworkTestResults] = useState('');
  const [networkTestLoading, setNetworkTestLoading] = useState(false);

  const handleLogin = async () => {
    setErrorText('');
    setDebugText('');
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
      setDebugText(buildLoginDebugInfo(err));
      Alert.alert(
        'Login Failed',
        errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNetworkTest = async () => {
    setNetworkTestLoading(true);
    setNetworkTestResults('Testing...');

    const endpoints = [
      { name: 'Google DNS', url: 'https://8.8.8.8' },
      { name: 'Google', url: 'https://google.com' },
      { name: 'Onrender.com', url: 'https://onrender.com' },
      { name: 'Backend Health', url: `${API_BASE_URL}/health` },
      { name: 'Backend Login', url: `${API_BASE_URL}/api/auth/login` },
    ];

    const results: string[] = [];
    for (const endpoint of endpoints) {
      const result = await testNetworkEndpoint(endpoint.url);
      results.push(`${endpoint.name}: ${result.ok ? `✓ (HTTP ${result.status})` : `✗ (${result.code})`}`);
    }

    setNetworkTestResults(results.join('\n'));
    setNetworkTestLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={['#FFF4E8', '#FFF9F2', '#fff']} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / Hero */}
          <AnimatedEntrance delay={30}>
            <View style={styles.hero}>
              <View style={styles.brandLogoFrame}>
                <Image
                  source={require('../../assets/images/brand_logo.png')}
                  style={styles.brandLogo}
                  resizeMode="cover"
                />
              </View>
            </View>
          </AnimatedEntrance>

          {/* Form */}
          <AnimatedEntrance delay={110}>
            <Card style={styles.form}>
              <ThemedText variant="title" style={styles.heading}>Welcome back</ThemedText>

              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
                textContentType="emailAddress"
              />

              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                textContentType="password"
              />

              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword((prev) => !prev)}
              >
                <ThemedText variant="label" style={styles.passwordToggleText}>
                  {showPassword ? 'Hide password' : 'See password'}
                </ThemedText>
              </TouchableOpacity>

              <Button
                label="Sign In"
                onPress={handleLogin}
                loading={loading}
                accessibilityLabel="Sign in to your account"
              />

              {errorText ? <ThemedText variant="caption" style={styles.errorText}>{errorText}</ThemedText> : null}

              {debugText ? (
                <View style={styles.debugBox}>
                  <ThemedText variant="label" style={styles.debugTitle}>Login Debug</ThemedText>
                  <ThemedText variant="caption" style={styles.debugText} selectable>{debugText}</ThemedText>
                  
                  <TouchableOpacity
                    style={styles.networkTestBtn}
                    onPress={handleNetworkTest}
                    disabled={networkTestLoading}
                  >
                    <ThemedText variant="label" style={styles.networkTestBtnText}>
                      {networkTestLoading ? 'Testing Network...' : 'Test Network Connectivity'}
                    </ThemedText>
                  </TouchableOpacity>

                  {networkTestResults ? (
                    <View style={styles.networkTestResults}>
                      <ThemedText variant="caption" style={styles.debugText} selectable>{networkTestResults}</ThemedText>
                    </View>
                  ) : null}
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => router.push('/(auth)/register')}
              >
                <ThemedText variant="body" style={styles.secondaryText}>
                  New here?{' '}
                  <ThemedText variant="label" style={styles.linkText}>Create an account</ThemedText>
                </ThemedText>
              </TouchableOpacity>
            </Card>
          </AnimatedEntrance>
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
    padding: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    gap: spacing.xs,
  },
  brandLogoFrame: {
    width: 220,
    height: 210,
    overflow: 'hidden',
  },
  brandLogo: {
    width: '100%',
    height: '100%',
  },
  form: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  heading: {
    marginBottom: spacing.xs,
  },
  passwordToggle: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: spacing.xs,
    minHeight: 32,
    justifyContent: 'center',
  },
  passwordToggleText: {
    color: colors.brand.primary,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  errorText: {
    color: colors.state.danger,
  },
  debugBox: {
    borderWidth: 1,
    borderColor: colors.border.strong,
    backgroundColor: '#FFF0FA',
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  debugTitle: {
    color: colors.text.primary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
  debugText: {
    color: colors.text.primary,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  networkTestBtn: {
    backgroundColor: colors.brand.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    minHeight: 36,
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  networkTestBtnText: {
    color: colors.text.inverse,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  networkTestResults: {
    backgroundColor: 'rgba(255, 79, 163, 0.05)',
    borderRadius: radius.sm,
    padding: spacing.xs,
    marginTop: spacing.xs,
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: spacing.xxs,
    minHeight: 44,
    justifyContent: 'center',
  },
  secondaryText: {
    color: colors.text.secondary,
    fontSize: typography.size.sm,
  },
  linkText: {
    color: colors.brand.primary,
    fontWeight: typography.weight.bold,
  },
});
