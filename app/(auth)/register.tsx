import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { AnimatedEntrance } from '@/components/ui/AnimatedEntrance';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import { colors, radius, spacing, typography } from '@/theme/tokens';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={['#FFF4E8', '#FFF9F2', '#fff']} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <AnimatedEntrance delay={30}>
            <View style={styles.hero}>
              <Ionicons name="paw" size={44} color={colors.brand.primary} />
              <ThemedText variant="title" style={styles.appName}>Join Pawprint</ThemedText>
              <ThemedText variant="body" style={styles.tagline}>Your pet social life starts here</ThemedText>
            </View>
          </AnimatedEntrance>

          <AnimatedEntrance delay={120}>
            <Card style={styles.form}>
              <ThemedText variant="title" style={styles.heading}>Create account</ThemedText>

              {fields.map(({ key, label, placeholder, secure, keyboard, autoCapitalize }) => {
                const isPasswordField = key === 'password';
                const isConfirmPasswordField = key === 'confirmPassword';
                const shouldShowToggle = isPasswordField || isConfirmPasswordField;
                const secureTextEntry =
                  isPasswordField
                    ? !showPassword
                    : isConfirmPasswordField
                      ? !showConfirmPassword
                      : secure;

                return (
                  <View key={key}>
                    <Input
                      label={label}
                      value={form[key]}
                      onChangeText={(val) => updateField(key, val)}
                      placeholder={placeholder}
                      secureTextEntry={secureTextEntry}
                      keyboardType={keyboard ?? 'default'}
                      autoCapitalize={autoCapitalize ?? 'none'}
                      returnKeyType="next"
                      textContentType={key === 'email' ? 'emailAddress' : key.includes('password') ? 'password' : 'none'}
                    />
                    {shouldShowToggle ? (
                      <TouchableOpacity
                        style={styles.passwordToggle}
                        onPress={() => {
                          if (isPasswordField) {
                            setShowPassword((prev) => !prev);
                            return;
                          }
                          setShowConfirmPassword((prev) => !prev);
                        }}
                      >
                        <ThemedText variant="label" style={styles.passwordToggleText}>
                          {(isPasswordField ? showPassword : showConfirmPassword) ? 'Hide password' : 'See password'}
                        </ThemedText>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              })}

              <Button
                label="Create Account"
                onPress={handleRegister}
                loading={loading}
                accessibilityLabel="Create your Pawprint account"
              />

              {errorText ? <ThemedText variant="caption" style={styles.errorText}>{errorText}</ThemedText> : null}

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => router.back()}
              >
                <ThemedText variant="body" style={styles.secondaryText}>
                  Already have an account?{' '}
                  <ThemedText variant="label" style={styles.linkText}>Sign in</ThemedText>
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
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl, paddingTop: 40 },
  hero: { alignItems: 'center', marginBottom: 28, gap: spacing.xs },
  logo: { fontSize: 48 },
  appName: { color: colors.brand.primary, letterSpacing: -0.5 },
  tagline: { color: colors.text.secondary },
  form: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: 14,
  },
  heading: { marginBottom: spacing.xs },
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
  errorText: { color: colors.state.danger },
  secondaryBtn: { alignItems: 'center', paddingVertical: spacing.xxs, minHeight: 44, justifyContent: 'center' },
  secondaryText: { fontSize: typography.size.sm, color: colors.text.secondary },
  linkText: { color: colors.brand.primary, fontWeight: typography.weight.bold },
});
