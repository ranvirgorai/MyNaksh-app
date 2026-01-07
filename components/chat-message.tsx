import { FEEDBACK_REASONS } from '@/constants/feedbackReasons';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
    Extrapolate,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 80;
const EMOJI_REACTIONS = ['🙏', '✨', '🌙','👍','🎊'];

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai_astrologer' | 'human_astrologer' | 'system';
  timestamp: Date;
  type?: 'text' | 'event' | 'ai' | 'human';
  hasFeedback?: boolean;
  feedbackType?: 'liked' | 'disliked' | null;
  feedbackReason?: 'inaccurate' | 'vague' | 'long' | null;
  replyTo?: string;
  reaction?: string;
}

interface ChatMessageProps {
  message: ChatMessage;
  allMessages?: ChatMessage[];
  onReply?: (message: ChatMessage) => void;
  onReaction?: (messageId: string, emoji: string | null) => void;
  onFeedback?: (messageId: string, feedbackType: 'liked' | 'disliked' | null, feedbackReason?: 'inaccurate' | 'vague' | 'long' | null) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, allMessages = [], onReply, onReaction, onFeedback }) => {
  const translateX = useSharedValue(0);
  const [showReactions, setShowReactions] = useState(false);
  const [showFeedbackChips, setShowFeedbackChips] = useState(false);
  const feedbackChipsAnim = useSharedValue(0);

  const getRepliedMessage = () => {
    if (!message.replyTo) return null;
    return allMessages.find(msg => msg.id === message.replyTo);
  };

  const showReactionsJS = (val: boolean) => {
    setShowReactions(val);
  };

  const handleReply=() => {
    onReply?.(message);
  }

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onBegin(() => {
      'worklet';
      runOnJS(showReactionsJS)(false);
    })
    .onUpdate((evt) => {
      'worklet';
      // only allow right-translation visually, but capture left swipes to prevent navigation back
      translateX.value = Math.max(evt.translationX, 0);
    })
    .onEnd((evt) => {
      'worklet';
      if (evt.translationX > SWIPE_THRESHOLD) {
        runOnJS(handleReply)();
      }
      translateX.value = withSpring(0);
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      'worklet';
      runOnJS(showReactionsJS)(true);
    });

  const gesture = Gesture.Simultaneous(panGesture, longPressGesture);

  const isUserMessage = message.sender === 'user';
  const timeString = message.timestamp.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const replyIndicatorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolate.CLAMP),
    transform: [
      { translateX: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [-40, 0], Extrapolate.CLAMP) },
    ],
  }));

  const messageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const feedbackChipsStyle = useAnimatedStyle(() => ({
    opacity: feedbackChipsAnim.value,
    maxHeight: interpolate(feedbackChipsAnim.value, [0, 1], [0, 120], Extrapolate.CLAMP),
  }));

  const handleReactionSelect = (emoji: string) => {
    setShowReactions(false);
    // toggle reaction: remove if same emoji selected again
    if (message.reaction === emoji) {
      onReaction?.(message.id, null);
    } else {
      onReaction?.(message.id, emoji);
    }
  };

  const handleFeedbackClick = (feedbackType: 'liked' | 'disliked') => {
    if (feedbackType === 'disliked' && message.feedbackType !== 'disliked') {
      setShowFeedbackChips(true);
      feedbackChipsAnim.value = withTiming(1, { duration: 300 });
    } else if (feedbackType === 'liked') {
      setShowFeedbackChips(false);
      feedbackChipsAnim.value = 0;
      onFeedback?.(message.id, 'liked', null);
    } else {
      feedbackChipsAnim.value = 0;
      setShowFeedbackChips(false);
    }
    onFeedback?.(message.id, feedbackType, message.feedbackReason);
  };

  const handleFeedbackReasonSelect = (reason: 'inaccurate' | 'vague' | 'long') => {
    onFeedback?.(message.id, 'disliked', reason);
  };

  return (
    <View style={[styles.container, { position: 'relative', marginBottom: message.reaction ? 12 : 4 }]}>
      {/* Reply indicator (appears on left during swipe) */}
      <Reanimated.View style={[styles.replyIndicator, replyIndicatorStyle]}>
        <MaterialIcons name="reply" size={24} color="#00a854" />
      </Reanimated.View>

      {/* Emoji reaction bar */}
      {showReactions && (
        <>
          <TouchableOpacity
            style={styles.reactionOverlay}
            activeOpacity={1}
            onPress={() => setShowReactions(false)}
          />

          <View
            style={[
              styles.reactionBar,
              isUserMessage ? styles.reactionBarRight : styles.reactionBarLeft,
            ]}
          >
            {EMOJI_REACTIONS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                onPress={() => handleReactionSelect(emoji)}
                style={styles.emojiButton}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Feedback buttons for AI Astrologer messages */}
      {message.sender === 'ai_astrologer' && (
        <View style={styles.feedbackContainer}>
          <TouchableOpacity
            style={[
              styles.feedbackButton,
              message.feedbackType === 'liked' && styles.feedbackButtonActive,
            ]}
            onPress={() => handleFeedbackClick('liked')}
          >
            <MaterialIcons 
              name="thumb-up" 
              size={18} 
              color={message.feedbackType === 'liked' ? '#00a854' : '#999'} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.feedbackButton,
              message.feedbackType === 'disliked' && styles.feedbackButtonActive,
            ]}
            onPress={() => handleFeedbackClick('disliked')}
          >
            <MaterialIcons 
              name="thumb-down" 
              size={18} 
              color={message.feedbackType === 'disliked' ? '#ff6b6b' : '#999'} 
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Feedback reason chips */}
      {message.sender === 'ai_astrologer' && message.feedbackType === 'disliked' && (
        <Reanimated.View style={[styles.feedbackChipsContainer, feedbackChipsStyle]}>
          {Object.values(FEEDBACK_REASONS).map((reasonConfig) => (
            <TouchableOpacity
              key={reasonConfig.key}
              style={[
                styles.feedbackChip,
                message.feedbackReason === reasonConfig.key && styles.feedbackChipSelected,
              ]}
              onPress={() => handleFeedbackReasonSelect(reasonConfig.key)}
            >
              <Text
                style={[
                  styles.feedbackChipText,
                  message.feedbackReason === reasonConfig.key && styles.feedbackChipTextSelected,
                ]}
              >
                {reasonConfig.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Reanimated.View>
      )}

      {/* Reply preview */}
      {getRepliedMessage() && (
        <View style={styles.replyPreviewContainer}>
          <View style={styles.replyPreviewBar} />
          <View style={styles.replyPreviewContent}>
            <Text style={styles.replyPreviewSender}>
              {getRepliedMessage()!.sender === 'ai_astrologer' ? 'AI Astrologer' : 
               getRepliedMessage()!.sender === 'human_astrologer' ? 'Astrologer' :
               getRepliedMessage()!.sender === 'user' ? 'You' : 'System'}
            </Text>
            <Text style={styles.replyPreviewText} numberOfLines={2}>
              {getRepliedMessage()!.text}
            </Text>
          </View>
        </View>
      )}

      {/* Message bubble */}
      <GestureDetector gesture={gesture}>
        <Reanimated.View style={[styles.messageWrapper, isUserMessage && styles.userMessageWrapper, messageAnimatedStyle]}>
          <View
            style={[
              styles.messageBubble,
              isUserMessage ? styles.userBubble : styles.otherBubble,
            ]}
          >
          <Text
            style={[
              styles.messageText,
              isUserMessage && styles.userMessageText,
            ]}
          >
            {message.text}
          </Text>
          <Text
            style={[
              styles.timestamp,
              isUserMessage && styles.userTimestamp,
            ]}
          >
            {timeString}
          </Text>
          {message.reaction && (
            <View
              style={[
                styles.reactionBubble,
                isUserMessage ? styles.reactionBubbleRight : styles.reactionBubbleLeft,
              ]}
            >
              <Text style={styles.reactionText}>{message.reaction}</Text>
            </View>
          )}
          </View>
        </Reanimated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 12,
  },
  messageWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  replyIndicator: {
    position: 'absolute',
    left: 0,
    top: '50%',
    marginTop: -12,
    paddingRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: SCREEN_WIDTH * 0.7,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  otherBubble: {
    backgroundColor: '#e5e5ea',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#00a854',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    color: '#000',
  },
  userMessageText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    color: '#666',
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  reactionBar: {
    position: 'absolute',
    top: -56,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  reactionBarLeft: {
    left: 12,
  },
  reactionBarRight: {
    right: 12,
  },
  emojiButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 20,
  },
  reactionEmoji: {
    fontSize: 14,
    marginTop: 6,
  },
  reactionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9,
  },
  reactionBubble: {
    position: 'absolute',
    bottom: -12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  reactionBubbleLeft: {
    left: 8,
  },
  reactionBubbleRight: {
    right: 8,
  },
  reactionText: {
    fontSize: 14,
  },
  feedbackContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  feedbackButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  feedbackButtonActive: {
    borderColor: '#00a854',
    backgroundColor: '#f0f8f5',
  },
  feedbackChipsContainer: {
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 4,
    gap: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  feedbackChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
  },
  feedbackChipSelected: {
    borderColor: '#ff6b6b',
    backgroundColor: '#ffe5e5',
  },
  feedbackChipText: {
    fontSize: 12,
    color: '#666',
  },
  feedbackChipTextSelected: {
    color: '#ff6b6b',
    fontWeight: '600',
  },
  replyPreviewContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: -8,
    paddingHorizontal: 8,
    alignItems: 'flex-start',
  },
  replyPreviewBar: {
    width: 3,
    backgroundColor: '#00a854',
    borderRadius: 2,
    marginTop: 4,
  },
  replyPreviewContent: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 8,
  },
  replyPreviewSender: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00a854',
    marginBottom: 4,
  },
  replyPreviewText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});
