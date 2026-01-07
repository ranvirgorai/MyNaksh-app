import React from 'react';
import Reanimated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

export function HelloWave() {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    // Wave: rotate to 25deg, then -15deg, repeat a few times
    rotation.value = withRepeat(
      withSequence(
        withTiming(25, { duration: 160, easing: Easing.linear }),
        withTiming(-15, { duration: 160, easing: Easing.linear })
      ),
      4,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Reanimated.Text style={[{ fontSize: 28, lineHeight: 32, marginTop: -6 }, animatedStyle]}>👋</Reanimated.Text>
  );
}
