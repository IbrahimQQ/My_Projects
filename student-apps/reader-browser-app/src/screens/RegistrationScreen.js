import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useApp } from '../context/AppContext';

const RegistrationScreen = () => {
  const { registerUser } = useApp();
  const [name, setName] = useState('');
  const [classGrade, setClassGrade] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!classGrade.trim()) {
      setError('Please enter your class/grade');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await registerUser(name.trim(), classGrade.trim());
      if (!success) {
        setError('Failed to register. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>📚</Text>
          </View>
          <Text style={styles.title}>Student Reader & Browser</Text>
          <Text style={styles.subtitle}>Your Educational Companion</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Welcome! Let's get started</Text>
          <Text style={styles.instructionText}>
            Please enter your details to personalize your learning experience
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Student Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Class / Grade</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Grade 10, JSS 3, SS 2"
              placeholderTextColor="#999"
              value={classGrade}
              onChangeText={setClassGrade}
              autoCapitalize="words"
            />
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.buttonText}>
              {isSubmitting ? 'Setting up...' : 'Get Started'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.privacyText}>
            Your data is stored locally on this device and is used only for
            tracking your learning progress.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4a90d9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 8,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#2c3e50',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#4a90d9',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#a0c4e8',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  privacyText: {
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
});

export default RegistrationScreen;
