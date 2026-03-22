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
import { colors, radius, spacing, typography } from '@/theme/tokens';

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
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                textContentType="password"
              />

              <Button
                label="Sign In"
                onPress={handleLogin}
                loading={loading}
                accessibilityLabel="Sign in to your account"
              />

              {errorText ? <ThemedText variant="caption" style={styles.errorText}>{errorText}</ThemedText> : null}

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
  errorText: {
    color: colors.state.danger,
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
