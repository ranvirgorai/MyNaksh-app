import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import { LayoutAnimation, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ChatRatingModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ChatRatingModal: React.FC<ChatRatingModalProps> = ({ visible, onClose }) => {
  const [rating, setRating] = useState<number>(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const handleSubmit = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setRatingSubmitted(true);
    // Real apps should persist/send rating here
  };

  const handleClose = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setRating(0);
    setRatingSubmitted(false);
    onClose();
  };

    if (!visible) return null;

    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <BlurView intensity={80} style={styles.modalBlur}>
          <View style={styles.ratingContainer}>
            {!ratingSubmitted ? (
              <>
                <Text style={styles.ratingTitle}>Rate your session</Text>
                <View style={styles.starsRow}>
                  {[1,2,3,4,5].map((n) => (
                    <TouchableOpacity
                      key={n}
                      onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setRating(n); }}
                      style={styles.starButton}
                    >
                      <MaterialIcons
                        name={n <= rating ? 'star' : 'star-border'}
                        size={36}
                        color={n <= rating ? '#FFD700' : '#ccc'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={[styles.submitButton, { opacity: rating > 0 ? 1 : 0.6 }]}
                  disabled={rating === 0}
                  onPress={handleSubmit}
                >
                  <Text style={styles.submitText}>Submit</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.thankYou}>Thank you</Text>
                <Text style={styles.thankYouSub}>Your feedback has been captured, and we appreciate you sharing it with us</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                >
                  <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </BlurView>
      </Modal>
    );

};

const styles = StyleSheet.create({
  modalBlur: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingContainer: {
    width: '84%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  starButton: {
    marginHorizontal: 6,
  },
  submitButton: {
    backgroundColor: '#00a854',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
  },
  thankYou: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  thankYouSub: {
    fontSize: 14,
    color: '#444',
    marginBottom: 16,
    textAlign: 'center',
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  closeText: {
    color: '#333',
    fontWeight: '600',
  },
});
