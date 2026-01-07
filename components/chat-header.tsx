import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ChatHeaderProps {
  title: string;
  subtitle: string;
  topInset: number;
  onBackPress?: () => void;
  onPhonePress?: () => void;
  onMorePress?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  title,
  subtitle,
  topInset,
  onBackPress,
  onPhonePress,
  onMorePress,
}) => {
  return (
    <View style={[styles.header, { paddingTop: topInset }]}>
      <TouchableOpacity onPress={onBackPress}>
        <MaterialIcons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <View style={styles.headerInfo}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
      </View>
      <TouchableOpacity onPress={onPhonePress}>
        {/* <MaterialIcons name="phone" size={24} color="#fff" /> */}
      </TouchableOpacity>
      <TouchableOpacity style={styles.moreButton} onPress={onMorePress}>
        <MaterialIcons name="more-vert" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#00a854',
    paddingHorizontal: 12,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  moreButton: {
    marginLeft: 4,
  },
});
