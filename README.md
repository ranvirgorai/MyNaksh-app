# Chat App with Swipe-to-Reply & Reactions

A chat interface built with React Native. The project uses
`react-native-reanimated` (v4+) for UI-thread animations and the modern Gesture
API from `react-native-gesture-handler` to handle pan + long-press gestures.

## Getting Started

### Prerequisites
```bash
node --version  # >= 20
npm --version   # or yarn
```

### Setup
```bash
npm install
# or
yarn install
```

### Development
```bash
npx expo start
```
Then:
- Press `i` for iOS
- Press `a` for Android
- Scan QR code with Expo app

### Testing Features
1. **Swipe right** on a message → reply triggers
2. **Long-press** a message (500ms) → emoji bar appears
3. **Tap emoji** → reaction bubble attaches
4. **Press back** in header → rating modal appears
5. **Select star** → animates; submit saves rating
6. **Type in input** → keyboard opens, list scrolls to top; keyboard closes, scrolls back

---

## Architecture Overview

### 1. Reanimated v4 & Animations

Implementation now uses `react-native-reanimated` v4 worklets so gesture handling
and animation updates run on the UI thread for buttery-smooth interactions.

Key points:
- Use `useSharedValue`, `useAnimatedStyle`, `withSpring` and `withTiming` for
  performant animations.
- Use `runOnJS` for one-way calls from worklets back to JS state/props.
- Add the Reanimated Babel plugin to enable worklets (see `babel.config.js`).

Example: translate a message bubble with a shared value
```tsx
const translateX = useSharedValue(0);
const messageStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: translateX.value }],
}));

// update from a gesture worklet
translateX.value = withSpring(newX);
```

Example: animate feedback chips height
```tsx
feedbackChipsAnim.value = withTiming(1, { duration: 300 });
const chipsStyle = useAnimatedStyle(() => ({
  opacity: feedbackChipsAnim.value,
  maxHeight: interpolate(feedbackChipsAnim.value, [0,1],[0,120]),
}));
```

Babel plugin (required):
```js
// babel.config.js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

---

### 2. Gesture Handling Approach

I have used the modern Gesture API from `react-native-gesture-handler` alongside
`react-native-reanimated` worklets. This keeps gesture processing on the UI
thread for smooth, responsive interactions.

Key pattern used in `components/chat-message.tsx`:
- `Gesture.Pan()` to handle horizontal swipes and update a `useSharedValue`.
- `Gesture.LongPress()` (500ms) to open the emoji reaction bar.
- Combine gestures with `Gesture.Simultaneous(pan, longPress)` so both gestures
  can be recognized without interference.
- Use `.activeOffsetX([-10, 10])` on the pan to capture horizontal movement and
  reduce accidental navigation-back gestures on iOS.

Conceptual example:
```tsx
const pan = Gesture.Pan()
  .activeOffsetX([-10, 10])
  .onBegin(() => { 'worklet'; runOnJS(hideReactions)(); })
  .onUpdate((e) => { 'worklet'; translateX.value = Math.max(e.translationX, 0); })
  .onEnd((e) => { 'worklet'; if (e.translationX > SWIPE_THRESHOLD) runOnJS(triggerReply)(); translateX.value = withSpring(0); });

const longPress = Gesture.LongPress().minDuration(500).onStart(() => { 'worklet'; runOnJS(showReactions)(); });

const gesture = Gesture.Simultaneous(pan, longPress);

<GestureDetector gesture={gesture}>
  <Animated.View style={messageStyle}>...</Animated.View>
</GestureDetector>
```

---

### 3. State Management: Redux Toolkit

**Choice: Redux Toolkit (RTK) for centralized, scalable state**

#### Why Redux over Context or Zustand?
1. **DevTools Integration**: Redux DevTools browser extension for debugging actions/state timeline
2. **Middleware Ecosystem**: easily add logging, persistence, async thunks in future
3. **Predictable Mutations**: Immer-based reducers prevent accidental state mutations
4. **Complex Async**: RTK Query (if added later) provides caching & data fetching out-of-box

#### Store Architecture

**File: `store/store.ts`**
```typescript
export const store = configureStore({
  reducer: {
    messages: messagesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

**File: `store/messagesSlice.ts`**
Contains message state and reducers:
- `setMessages` - bulk replace
- `addMessage` - append new message
- `updateMessage` - partial update by ID
- `setReaction` - toggle emoji reaction on message
- `setFeedback` - set like/dislike + feedback reason

#### Integration Flow

1. **App Initialization**: `app/_layout.tsx` wraps entire app with Redux Provider
   ```typescript
   <Provider store={store}>
     {/* all routes have access to Redux state */}
   </Provider>
   ```

2. **Component Usage**: `components/chat-screen.tsx`
   ```typescript
   const dispatch = useDispatch<AppDispatch>();
   const storeMessages = useSelector((state: RootState) => state.messages);
   
   // Convert timestamps for UI (stored as numbers in Redux)
   const messages = React.useMemo(
     () => storeMessages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })),
     [storeMessages]
   );

   // Dispatch actions on user interaction
   const handleReaction = (messageId: string, emoji: string | null) => {
     dispatch(setReaction({ id: messageId, reaction: emoji ?? undefined }));
   };
   ```

3. **Persistence** (optional future enhancement):
   - RTK Persist middleware can auto-save/restore Redux state to device storage

#### State Shape
```typescript
{
  messages: [
    {
      id: string;
      text: string;
      sender: 'user' | 'ai_astrologer' | 'human_astrologer' | 'system';
      timestamp: number; // milliseconds, stored as number for serialization
      type?: 'text' | 'event' | 'ai' | 'human';
      feedbackType?: 'liked' | 'disliked' | null;
      feedbackReason?: 'inaccurate' | 'vague' | 'long' | null;
      replyTo?: string; // ID of message being replied to
      reaction?: string; // emoji
    }
  ]
}
```

---

## Component Structure

```
components/
  ├── chat-screen.tsx          # Main screen, FlatList of messages, Redux integration
  ├── chat-message.tsx         # Individual message, gestures, reactions, feedback
  ├── chat-header.tsx          # Header with back, phone, more buttons
  ├── chat-rating-modal.tsx    # 5-star rating modal (triggered by back press)
  └── chat-index.ts            # Barrel exports

constants/
  └── feedbackReasons.ts       # Feedback config with i18n support

store/
  ├── store.ts                 # Redux store config
  └── messagesSlice.ts         # Messages reducer & actions
```

---

## Key Features

### Swipe-to-Reply
- Right swipe on any message → sets as reply target
- Reply preview bar shows below input
- Mentioned message highlighted in conversation

### Emoji Reactions
- Long-press (500ms) on message → horizontal emoji bar
- Tap emoji → reaction bubble attached to message
- Same emoji again → removes reaction
- Overlay dismiss on outside tap

### Feedback System (AI Messages Only)
- **Like**: single tap thumbs-up
- **Dislike**: expands feedback reason chips
  - Inaccurate
  - Too Vague
  - Too Long
- Selections stored in Redux per message

### Rating Modal
- Triggered by back button press
- Full-screen blur backdrop
- 5-star selection with animations
- "Thank you" confirmation screen
- Close button resets state

### Keyboard Handling
- Keyboard open → list scrolls to top
- Keyboard close → list scrolls to bottom
- Smooth animations for natural UX

---


## Future Enhancements

1. **RTK Query**: Add data fetching layer for backend sync
2. **Persistence**: Redux Persist for offline support
3. **i18n**: Integrate translation library (config prepared in `constants/feedbackReasons.ts`)
4. **Analytics**: Redux middleware for tracking user interactions
5. **Haptic Feedback**: Add vibration on swipe threshold/reaction select

---

## Technical Notes

- Timestamps stored as numbers (milliseconds) in Redux for serialization; converted to `Date` objects in UI layer
- LayoutAnimation disabled by default on Android; enabled in effect hook with platform check
- Keyboard listeners manage scroll position for optimal UX when input is focused
- Feedback reasons centralized in config for easy i18n integration
- Modal rendered as native Modal component for full-screen coverage (not clipped to parent bounds)
