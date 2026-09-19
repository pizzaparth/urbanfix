import React from 'react';
import { View, Pressable } from 'react-native';
import { showPeek, hidePeek } from './GlobalPeek.jsx';

export default function PeekWrapper({ children, renderPeek, style }) {
  return (
    <View style={style}>
      <Pressable
        onLongPress={() => showPeek(renderPeek)}
        onPressOut={() => hidePeek()}
        delayLongPress={400}
      >
        {children}
      </Pressable>
    </View>
  );
}
