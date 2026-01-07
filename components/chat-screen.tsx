import { addMessage, setFeedback, setReaction } from '@/store/messagesSlice';
import { AppDispatch, RootState } from '@/store/store';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    UIManager,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { ChatHeader } from './chat-header';
import { ChatMessage } from './chat-message';
import { ChatRatingModal } from './chat-rating-modal';

// Messages are now stored in Redux (see /store/messagesSlice.ts)

interface ReplyingTo {
  id: string;
  text: string;
}

export const ChatScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  React.useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      // @ts-ignore
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);
  const dispatch = useDispatch<AppDispatch>();
  const storeMessages = useSelector((state: RootState) => state.messages);
  const messages = React.useMemo(
    () => storeMessages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })),
    [storeMessages]
  );

  const handleReaction = (messageId: string, emoji: string | null) => {
    dispatch(setReaction({ id: messageId, reaction: emoji ?? undefined }));
  };

  const handleFeedback = (messageId: string, feedbackType: 'liked' | 'disliked' | null, feedbackReason?: 'inaccurate' | 'vague' | 'long' | null) => {
    dispatch(setFeedback({ id: messageId, feedbackType, feedbackReason }));
  };

  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ReplyingTo | null>(null);

  const handleSendMessage = () => {
    if (inputText.trim().length === 0) return;

    const newMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user' as const,
      timestamp: Date.now(), // store as number in redux
      type: 'text' as const,
      replyTo: replyingTo?.id,
    };

    dispatch(addMessage(newMessage));
    setInputText('');
    setReplyingTo(null);
  };

  const handleReply = (message: any) => {
    setReplyingTo({
      id: message.id,
      text: message.text,
    });
  };

  const renderMessage = ({ item }: { item: any }) => (
    <ChatMessage 
      message={item} 
      allMessages={messages}
      onReply={handleReply} 
      onReaction={handleReaction}
      onFeedback={handleFeedback}
    />
  );



  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar barStyle="light-content" backgroundColor="#00a854" />
      <ChatHeader
        title="Astrologer Vikram"
        subtitle="Active now"
        topInset={insets.top}
        onBackPress={() => setShowRating(true)}
      />

      <ChatRatingModal visible={showRating} onClose={() => setShowRating(false)} />

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        inverted={false}
      />

      {/* Reply preview */}
      {replyingTo && (
        <View style={styles.replyPreview}>
          <View style={styles.replyPreviewContent}>
            <Text style={styles.replyLabel}>Replying to</Text>
            <Text style={styles.replyText} numberOfLines={1}>
              {replyingTo.text}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setReplyingTo(null)}>
            <MaterialIcons name="close" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      )}

      {/* Input area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxHeight={100}
        />
        <TouchableOpacity
          onPress={handleSendMessage}
          disabled={inputText.trim().length === 0}
        >
          <MaterialIcons
            name="send"
            size={24}
            color={inputText.trim().length === 0 ? '#ccc' : '#00a854'}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  messagesList: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  replyPreview: {
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  replyPreviewContent: {
    flex: 1,
    borderLeftWidth: 4,
    borderLeftColor: '#00a854',
    paddingLeft: 8,
  },
  replyLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  replyText: {
    fontSize: 13,
    color: '#333',
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
  },
  modalBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingContainer: {
    width: '84%',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
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
