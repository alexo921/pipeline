import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
  Image,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import {
  NavChatIcon,
  NavHomeIconPip,
  NavProfileIconProfile,
} from '../components/NavIcons';
import UserAvatar from '../../assets/mobile-user.svg';

const EllipseGlow: React.FC<{
  width: number;
  height: number;
  style?: any;
  gradientId: string;
}> = ({ width, height, style, gradientId }) => (
  <Svg width={width} height={height} style={style} viewBox={`0 0 ${width} ${height}`}>
    <Defs>
      <RadialGradient id={gradientId} cx="50%" cy="50%" rx="50%" ry="50%">
        <Stop offset="0%" stopColor="rgba(149,169,255,0.32)" stopOpacity="0.9" />
        <Stop offset="35%" stopColor="rgba(149,169,255,0.24)" stopOpacity="0.7" />
        <Stop offset="60%" stopColor="rgba(149,169,255,0.10)" stopOpacity="0.45" />
        <Stop offset="80%" stopColor="rgba(149,169,255,0.12)" stopOpacity="0.25" />
        <Stop offset="100%" stopColor="rgba(149,169,255,0.10)" stopOpacity="0" />
      </RadialGradient>
    </Defs>
    <Rect x="0" y="0" width={width} height={height} fill={`url(#${gradientId})`} />
  </Svg>
);

const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, setUser } = useAuth();
  const displayName =
    user?.firstName || user?.lastName
      ? `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()
      : user?.name ?? 'Marvin Grant';
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;
  const [activeModal, setActiveModal] = React.useState<
    'edit' | 'security' | 'privacy' | 'notifications' | null
  >(null);
  const [profileForm, setProfileForm] = React.useState({
    name: displayName,
    email: user?.email ?? 'marvin.grant@example.com',
    phone: '555-123-4567',
  });
  const [securityOptions, setSecurityOptions] = React.useState({
    twoFactor: true,
    loginAlerts: true,
  });
  const [privacyOptions, setPrivacyOptions] = React.useState({
    shareActivity: false,
    personalizedTips: true,
  });
  const [notificationOptions, setNotificationOptions] = React.useState({
    pushEnabled: true,
  });

  const displayLocation = user?.location ?? 'New Haven, CT';

  const renderModalContent = () => {
    switch (activeModal) {
      case 'edit':
        return (
          <>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit profile</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={20} color="#4A4F63" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalFieldLabel}>Name</Text>
            <TextInput
              style={styles.modalInput}
              value={profileForm.name}
              onChangeText={(text) => setProfileForm((prev) => ({ ...prev, name: text }))}
              placeholder="Name"
            />
            <Text style={styles.modalFieldLabel}>Email</Text>
            <TextInput
              style={styles.modalInput}
              value={profileForm.email}
              onChangeText={(text) => setProfileForm((prev) => ({ ...prev, email: text }))}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={styles.modalFieldLabel}>Phone</Text>
            <TextInput
              style={styles.modalInput}
              value={profileForm.phone}
              onChangeText={(text) => setProfileForm((prev) => ({ ...prev, phone: text }))}
              placeholder="Phone"
              keyboardType="phone-pad"
            />
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalGhostButton]}
                onPress={() => setActiveModal(null)}
              >
                <Text style={[styles.modalButtonText, styles.modalGhostButtonText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={() => setActiveModal(null)}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </>
        );
      case 'security':
        return (
          <>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Security</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={20} color="#4A4F63" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalSwitchRow}>
              <Text style={styles.modalFieldLabel}>Two-factor authentication</Text>
              <Switch
                value={securityOptions.twoFactor}
                onValueChange={(value) => setSecurityOptions((prev) => ({ ...prev, twoFactor: value }))}
              />
            </View>
            <View style={styles.modalSwitchRow}>
              <Text style={styles.modalFieldLabel}>Login alerts</Text>
              <Switch
                value={securityOptions.loginAlerts}
                onValueChange={(value) => setSecurityOptions((prev) => ({ ...prev, loginAlerts: value }))}
              />
            </View>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalGhostButton]}
                onPress={() => setActiveModal(null)}
              >
                <Text style={[styles.modalButtonText, styles.modalGhostButtonText]}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={() => setActiveModal(null)}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </>
        );
      case 'privacy':
        return (
          <>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Privacy</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={20} color="#4A4F63" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalSwitchRow}>
              <Text style={styles.modalFieldLabel}>Share activity insights</Text>
              <Switch
                value={privacyOptions.shareActivity}
                onValueChange={(value) => setPrivacyOptions((prev) => ({ ...prev, shareActivity: value }))}
              />
            </View>
            <View style={styles.modalSwitchRow}>
              <Text style={styles.modalFieldLabel}>Personalized tips</Text>
              <Switch
                value={privacyOptions.personalizedTips}
                onValueChange={(value) => setPrivacyOptions((prev) => ({ ...prev, personalizedTips: value }))}
              />
            </View>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalGhostButton]}
                onPress={() => setActiveModal(null)}
              >
                <Text style={[styles.modalButtonText, styles.modalGhostButtonText]}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={() => setActiveModal(null)}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </>
        );
      case 'notifications':
        return (
          <>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={20} color="#4A4F63" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalSwitchRow}>
              <Text style={styles.modalFieldLabel}>Push notifications</Text>
              <Switch
                value={notificationOptions.pushEnabled}
                onValueChange={(value) => setNotificationOptions((prev) => ({ ...prev, pushEnabled: value }))}
              />
            </View>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalGhostButton]}
                onPress={() => setActiveModal(null)}
              >
                <Text style={[styles.modalButtonText, styles.modalGhostButtonText]}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={() => setActiveModal(null)}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </>
        );
      default:
        return null;
    }
  };
  const handleLogout = async () => {
    await setUser(null, null);
  };
  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <View pointerEvents="none" style={styles.backgroundLayer}>
        <EllipseGlow width={500} height={620} gradientId="pipGlowTop" style={styles.topEllipse} />
        <EllipseGlow width={300} height={320} gradientId="pipGlowBottom" style={styles.bottomEllipse} />
      </View>
      <View style={styles.contentLayer}>
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 30 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <View style={{ width: 44 }} />
            <Text style={styles.headerTitle}>Profile</Text>
            <View style={{ width: 44 }} />
          </View>

          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <LinearGradient
                colors={['#E9F0FF', '#95A9FF', '#ECF4FF']}
                style={[StyleSheet.absoluteFill, styles.avatarGradient]}
              />
              <UserAvatar width={80} height={80} />
            </View>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.location}>{displayLocation}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.card}>
              <TouchableOpacity style={styles.cardRow} onPress={() => setActiveModal('edit')} activeOpacity={0.85}>
                <Ionicons name="person-outline" size={20} color="#4A4F63" />
                <Text style={styles.cardText}>Edit profile</Text>
                <Ionicons name="chevron-forward" size={18} color="#A3A9BA" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.cardRow} onPress={() => setActiveModal('security')} activeOpacity={0.85}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#4A4F63" />
                <Text style={styles.cardText}>Security</Text>
                <Ionicons name="chevron-forward" size={18} color="#A3A9BA" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cardRow}
                onPress={() => setActiveModal('notifications')}
                activeOpacity={0.85}
              >
                <Ionicons name="notifications-outline" size={20} color="#4A4F63" />
                <Text style={styles.cardText}>Notifications</Text>
                <Ionicons name="chevron-forward" size={18} color="#A3A9BA" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.cardRow} onPress={() => setActiveModal('privacy')} activeOpacity={0.85}>
                <Ionicons name="lock-closed-outline" size={20} color="#4A4F63" />
                <Text style={styles.cardText}>Privacy</Text>
                <Ionicons name="chevron-forward" size={18} color="#A3A9BA" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support & About</Text>
            <View style={styles.card}>
              <TouchableOpacity style={styles.cardRow} activeOpacity={0.85}>
                <Ionicons name="help-circle-outline" size={20} color="#4A4F63" />
                <Text style={styles.cardText}>Help & Support</Text>
                <Ionicons name="chevron-forward" size={18} color="#A3A9BA" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.cardRow} activeOpacity={0.85}>
                <Ionicons name="information-circle-outline" size={20} color="#4A4F63" />
                <Text style={styles.cardText}>Terms and Policies</Text>
                <Ionicons name="chevron-forward" size={18} color="#A3A9BA" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.cardRow} activeOpacity={0.85} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color="#C6534C" />
                <Text style={[styles.cardText, styles.logoutText]}>Log out</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.bottomNavOuter}>
            <View
              style={[
                styles.bottomNavContainer,
                {
                  paddingBottom: Math.max(insets.bottom + 8, 20),
                },
              ]}
            >
              <View style={styles.bottomNavWrapper}>
                <View style={styles.bottomNavShadow} pointerEvents="none" />
                <LinearGradient colors={['#FFFFFF', '#F6F7FF']} style={styles.bottomNav}>
                  <View style={styles.bottomNavHighlight} pointerEvents="none" />
                  <TouchableOpacity
                    style={styles.bottomNavIcon}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('Home', { animation: 'slide_from_left' })}
                  >
                    <NavHomeIconPip size={51} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.floatingButton}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('Chat', { animation: 'slide_from_left' })}
                  >
                    <View style={styles.chatIconWrapper}>
                      <NavChatIcon size={51} />
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.bottomNavIcon} activeOpacity={0.85}>
                    <NavProfileIconProfile size={51} />
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      <Modal visible={!!activeModal} transparent animationType="fade" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>{renderModalContent()}</View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  contentLayer: {
    flex: 1,
    zIndex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  topEllipse: {
    position: 'absolute',
    top: -150,
    left: -180,
    opacity: 0.5,
    width: 600,
    height: 420,
    borderRadius: 260,
  },
  bottomEllipse: {
    position: 'absolute',
    bottom: 50,
    right: -150,
    opacity: 0.5,
    width: 320,
    height: 320,
    borderRadius: 260,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0B1F41',
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#6573FF',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 6,
  },
  avatarGradient: {
    borderRadius: 60,
  },
  name: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: '700',
    color: '#0B1F41',
    fontFamily: Platform.select({ ios: 'Avenir-Heavy', android: 'sans-serif-medium' }),
  },
  location: {
    marginTop: 6,
    fontSize: 15,
    color: '#5A6B89',
    fontFamily: Platform.select({ ios: 'Avenir', android: 'sans-serif' }),
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0B1F41',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
    gap: 10,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 12,
    justifyContent: 'space-between',
  },
  cardText: {
    fontSize: 16,
    color: '#1F2A44',
    fontFamily: Platform.select({ ios: 'Avenir-Heavy', android: 'sans-serif-medium' }),
  },
  logoutText: {
    color: '#C6534C',
  },
  bottomNavOuter: {
    width: '85%',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 16,
  },
  bottomNavContainer: {
    width: '84%',
    maxWidth: 320,
    alignItems: 'center',
    marginTop: 8,
    overflow: 'visible',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0B1F41',
  },
  modalFieldLabel: {
    fontSize: 14,
    color: '#4A4F63',
    marginTop: 8,
  },
  modalInput: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D7DBE6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1F2A44',
  },
  modalSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0B1F41',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalGhostButton: {
    backgroundColor: '#EEF1FA',
  },
  modalGhostButtonText: {
    color: '#0B1F41',
  },
  bottomNavWrapper: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNavShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 44,
    backgroundColor: '#FFFFFF',
    shadowColor: '#7B84D6',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 21,
    elevation: 12,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 44,
    paddingHorizontal: 26,
    paddingVertical: 6,
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
  bottomNavHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: 'transparent',
  },
  bottomNavIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6573FF',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    backgroundColor: 'transparent',
  },
  chatIconWrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ProfileScreen;
