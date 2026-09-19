import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  Extrapolation,
  runOnUI,
} from 'react-native-reanimated';

import { colors, uf as font } from '../theme.js';

const THRESHOLD = 88;

const SwipeQuestionCard = React.forwardRef(function SwipeQuestionCard({ question, category, onAnswer }, ref) {
  const { width } = useWindowDimensions();
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const gone = useSharedValue(0);

  const commit = (answer) => onAnswer(answer);

  const fling = (dir) => {
    'worklet';
    gone.value = 1;
    x.value = withTiming(dir * (width + 160), { duration: 320 });
    y.value = withTiming(70, { duration: 320 });
    runOnJS(commit)(dir > 0 ? 'Yes' : 'No');
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (gone.value) return;
      x.value = e.translationX;
      y.value = e.translationY * 0.22;
    })
    .onEnd((e) => {
      if (gone.value) return;
      const fast = Math.abs(e.velocityX) > 900;
      if (Math.abs(x.value) > THRESHOLD || fast) {
        fling(x.value > 0 || e.velocityX > 0 ? 1 : -1);
      } else {
        x.value = withSpring(0, { damping: 15, stiffness: 190 });
        y.value = withSpring(0, { damping: 15, stiffness: 190 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: (x.value / 16) + 'deg' },
    ],
    opacity: interpolate(Math.abs(x.value), [0, width * 0.9], [1, 0], Extrapolation.CLAMP),
  }));

  const yesStamp = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [0, 96], [0, 1], Extrapolation.CLAMP),
  }));

  const noStamp = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [-96, 0], [1, 0], Extrapolation.CLAMP),
  }));

  React.useImperativeHandle(ref, () => ({
    swipe: (dir) => runOnUI(fling)(dir),
  }));

  return (
    <View style={s.stage}>
      <View style={s.ghost} />
      <GestureDetector gesture={pan}>
        <Animated.View style={[s.cardWrap, cardStyle]}>
          <View style={s.card}>
            <Animated.View style={[s.stamp, s.stampYes, yesStamp]}>
              <Text style={[s.stampText, { color: '#4ADE9B' }]}>YES</Text>
            </Animated.View>
            <Animated.View style={[s.stamp, s.stampNo, noStamp]}>
              <Text style={[s.stampText, { color: '#FF5A7A' }]}>NO</Text>
            </Animated.View>

            <Text style={s.kicker}>{category.toUpperCase()}</Text>
            <Text style={s.question}>{question}</Text>
            <Text style={s.hint}>‹  Swipe to answer  ›</Text>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

export default SwipeQuestionCard;

const s = StyleSheet.create({
  stage: { minHeight: 392, justifyContent: 'center' },
  ghost: {
    position: 'absolute', left: 0, right: 0, top: 14, bottom: 20,
    borderRadius: 38, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  cardWrap: { borderRadius: 38 },
  card: {
    minHeight: 380,
    borderRadius: 38,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
    paddingHorizontal: 28,
    paddingVertical: 44,
  },
  stamp: { position: 'absolute', top: 24, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 3, borderRadius: 16 },
  stampYes: { left: 24, borderColor: '#4ADE9B', transform: [{ rotate: '-14deg' }] },
  stampNo: { right: 24, borderColor: '#FF5A7A', transform: [{ rotate: '14deg' }] },
  stampText: { fontFamily: font.display, fontSize: 26, letterSpacing: 1.6 },
  kicker: { fontFamily: font.bodyBold, fontSize: 14, letterSpacing: 1.6, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  question: { fontFamily: font.display, fontSize: 38, lineHeight: 43, color: colors.text, textAlign: 'center', letterSpacing: -0.7 },
  hint: { fontFamily: font.bodyBold, fontSize: 15, color: 'rgba(255,255,255,0.65)' },
});
