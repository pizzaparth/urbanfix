import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut, useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolate } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

let peekListener = null;

export const showPeek = (renderPeek) => {
  if (peekListener) peekListener(renderPeek);
};

export const hidePeek = () => {
  if (peekListener) peekListener(null);
};

export function GlobalPeek() {
  const [renderContent, setRenderContent] = useState(null);
  const progress = useSharedValue(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    peekListener = (content) => {
      if (content) {
        setRenderContent(() => content);
        setVisible(true);
        progress.value = withSpring(1, { damping: 15, stiffness: 400, mass: 0.5 });
      } else {
        progress.value = withTiming(0, { duration: 150 });
        setTimeout(() => setVisible(false), 150);
      }
    };
    return () => { peekListener = null; };
  }, []);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.8, 1]) }],
  }));

  if (!visible) return null;

  return (
    <View style={s.container} pointerEvents="none">
      <Animated.View style={[s.backdrop, backdropStyle]} />
      <Animated.View style={[s.content, contentStyle]}>
        {renderContent && renderContent()}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
    elevation: 99999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  content: {
    width: width - 40,
    backgroundColor: '#120E13',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2C222B',
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 10,
  },
});
