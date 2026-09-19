import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Icon from './Icon.jsx';
import { colors, uf as font, ufRadius as radius } from '../theme.js';

const PAD = 7;
const BAR_SIDE = 14;
const TAB_H = 58;
const ACTIVE_W = 1.5; // selected tab is 1.5x a normal tab

const TIMING = { duration: 200 };

export default function GlassTabBar({ state, descriptors, navigation }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const routes = state.routes;
  const activeIndex = state.index;

  const trackWidth = width - BAR_SIDE * 2 - PAD * 2 - 2;
  const units = routes.length - 1 + ACTIVE_W;
  const unit = trackWidth / units;

  const pillW = useSharedValue(unit * ACTIVE_W);
  const pillX = useSharedValue(0);

  React.useEffect(() => {
    pillX.value = withTiming(activeIndex * unit, TIMING);
    pillW.value = withTiming(unit * ACTIVE_W, TIMING);
  }, [activeIndex, unit]);

  const pillStyle = useAnimatedStyle(() => ({
    width: pillW.value,
    transform: [{ translateX: pillX.value }],
  }));

  return (
    <View
      style={[styles.wrap, { left: BAR_SIDE, right: BAR_SIDE, bottom: 14 + insets.bottom }]}
      pointerEvents="box-none"
    >
      <View style={styles.glass}>
        <View style={styles.track}>
          <Animated.View style={[styles.pill, pillStyle]} />
          {routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label = options.title || route.name;
            const iconName = options.tabBarIconName || 'home';
            const focused = activeIndex === index;
            return (
              <TabButton
                key={route.key}
                label={label}
                iconName={iconName}
                focused={focused}
                flex={focused ? ACTIVE_W : 1}
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
                }}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

function TabButton({ label, iconName, focused, flex, onPress }) {
  const grow = useSharedValue(flex);
  React.useEffect(() => {
    grow.value = withTiming(flex, TIMING);
  }, [flex]);
  const animStyle = useAnimatedStyle(() => ({ flexGrow: grow.value }));

  return (
    <Animated.View style={[styles.tabOuter, animStyle]}>
      <Pressable onPress={onPress} style={styles.tab}>
        <View style={styles.iconSlot}>
          <Icon name={iconName} size={22} color={focused ? colors.accentInk : colors.faint} />
        </View>
        {focused ? (
          <View style={styles.labelSlot}>
            <Text numberOfLines={1} style={[styles.label, { color: colors.accentInk }]}>
              {label}
            </Text>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 22,
    elevation: 12,
  },
  glass: {
    padding: PAD,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#000000', // AMOLED black
  },
  track: { flexDirection: 'row', height: TAB_H, alignItems: 'stretch' },
  pill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: TAB_H,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    zIndex: 0,
  },
  tabOuter: { flexBasis: 0, minWidth: 0, zIndex: 1 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 2 },
  iconSlot: { height: 24, alignItems: 'center', justifyContent: 'center' },
  labelSlot: { height: 16, alignItems: 'center', justifyContent: 'center', width: '100%', overflow: 'hidden' },
  label: { fontFamily: font.bodyBold, fontSize: 13, lineHeight: 16 },
});
