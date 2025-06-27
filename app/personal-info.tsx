import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Edit,
  Save
} from 'lucide-react-native';
import { authService, AuthState } from '@/lib/auth';
import { useTheme } from '@/lib/theme';

export default function PersonalInfoScreen() {
  const { theme } = useTheme();
  const [userProfile, setUserProfile] = useState<AuthState>(authService.getAuthState());
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
  });

  useEffect(() => {
    const unsubscribe = authService.subscribe((authState: AuthState) => {
      setUserProfile(authState);
      if (authState.user) {
        setFormData({
          fullName: authState.user.full_name || '',
          email: authState.user.email || '',
          phone: '', // Add phone to user type if needed
          address: '', // Add address to user type if needed
          dateOfBirth: '', // Add DOB to user type if needed
        });
      }
    });
    return unsubscribe;
  }, []);

  const handleSave = async () => {
    try {
      // Here you would implement the actual update logic
      // await userService.updateProfile(formData);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const InfoField = ({ 
    icon: Icon, 
    label, 
    value, 
    placeholder, 
    editable = true,
    onChangeText 
  }: any) => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <Icon size={20} color={theme.colors.textSecondary} />
        <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
      </View>
      {isEditing && editable ? (
        <TextInput
          style={[styles.fieldInput, { 
            backgroundColor: theme.colors.surface, 
            color: theme.colors.text,
            borderColor: theme.colors.primary 
          }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
        />
      ) : (
        <Text style={[styles.fieldValue, { 
          backgroundColor: theme.colors.surface, 
          color: theme.colors.text,
          borderColor: theme.colors.border 
        }]}>{value || 'Not provided'}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.colors.surface }]}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Personal Information</Text>
        <TouchableOpacity 
          onPress={isEditing ? handleSave : () => setIsEditing(true)}
          style={[styles.editButton, { backgroundColor: theme.colors.surface }]}
        >
          {isEditing ? (
            <Save size={24} color={theme.colors.primary} />
          ) : (
            <Edit size={24} color={theme.colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Basic Information</Text>
          
          <InfoField
            icon={User}
            label="Full Name"
            value={formData.fullName}
            placeholder="Enter your full name"
            onChangeText={(text: string) => setFormData({...formData, fullName: text})}
          />

          <InfoField
            icon={Mail}
            label="Email Address"
            value={formData.email}
            placeholder="Enter your email"
            editable={false}
          />

          <InfoField
            icon={Phone}
            label="Phone Number"
            value={formData.phone}
            placeholder="Enter your phone number"
            onChangeText={(text: string) => setFormData({...formData, phone: text})}
          />

          <InfoField
            icon={Calendar}
            label="Date of Birth"
            value={formData.dateOfBirth}
            placeholder="YYYY-MM-DD"
            onChangeText={(text: string) => setFormData({...formData, dateOfBirth: text})}
          />
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Address Information</Text>
          
          <InfoField
            icon={MapPin}
            label="Address"
            value={formData.address}
            placeholder="Enter your address"
            onChangeText={(text: string) => setFormData({...formData, address: text})}
          />
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Account Status</Text>
          
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <Text style={[styles.statusLabel, { color: theme.colors.textSecondary }]}>Account Type</Text>
              <Text style={[styles.statusValue, { color: theme.colors.text }]}>Standard</Text>
            </View>
            
            <View style={styles.statusItem}>
              <Text style={[styles.statusLabel, { color: theme.colors.textSecondary }]}>Verification Status</Text>
              <Text style={[styles.statusValue, styles.verified]}>Verified</Text>
            </View>
            
            <View style={styles.statusItem}>
              <Text style={[styles.statusLabel, { color: theme.colors.textSecondary }]}>Member Since</Text>
              <Text style={[styles.statusValue, { color: theme.colors.text }]}>
                {userProfile.user?.created_at 
                  ? new Date(userProfile.user.created_at).toLocaleDateString()
                  : 'N/A'
                }
              </Text>
            </View>
          </View>
        </View>

        {isEditing && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.cancelButton, { borderColor: theme.colors.border }]}
              onPress={() => setIsEditing(false)}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    borderRadius: 12,
    padding: 20,
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  fieldValue: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  fieldInput: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  statusContainer: {
    gap: 16,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusLabel: {
    fontSize: 14,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  verified: {
    color: '#10B981',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
