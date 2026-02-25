import React from 'react';
import { StyleSheet } from 'react-native';
import HomeIcon from '../../assets/mobile-home.svg';
import ProfileIcon from '../../assets/mobile-profile.svg';
import ChatIcon from '../../assets/mobile-pip.svg';
import HomeIconPip from '../../assets/mobile-home-pip.svg';
import ProfileIconPip from '../../assets/mobile-profile-pip.svg';
import ProfileIconProfile from '../../assets/mobile-profile-profile.svg';

type IconProps = {
  size?: number;
};

export const NavHomeIcon: React.FC<IconProps> = ({ size = 51 }) => (
  <HomeIcon width={size} height={size} style={styles.icon} />
);

export const NavHomeIconPip: React.FC<IconProps> = ({ size = 51 }) => (
  <HomeIconPip width={size} height={size} style={styles.icon} />
);

export const NavProfileIcon: React.FC<IconProps> = ({ size = 51 }) => (
  <ProfileIcon width={size} height={size} style={styles.icon} />
);

export const NavProfileIconPip: React.FC<IconProps> = ({ size = 51 }) => (
  <ProfileIconPip width={size} height={size} style={styles.icon} />
);

export const NavProfileIconProfile: React.FC<IconProps> = ({ size = 51 }) => (
  <ProfileIconProfile width={size} height={size} style={styles.icon} />
);

export const NavChatIcon: React.FC<{ size?: number }> = ({ size = 51 }) => (
  <ChatIcon width={size} height={size} style={styles.icon} />
);

const styles = StyleSheet.create({
  icon: {
    resizeMode: 'contain',
  },
});
