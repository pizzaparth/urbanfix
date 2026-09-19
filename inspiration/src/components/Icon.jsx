import React from 'react';
import Svg, { Path, Circle, Rect, Line, Polyline, Polygon } from 'react-native-svg';

// Stroke-only line icons. One component, switched by name.
export default function Icon({ name, size = 22, color = '#FFFFFF', strokeWidth = 2 }) {
  const p = { stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'home' && (
        <>
          <Polygon points="3 11 12 4 21 11" {...p} />
          <Rect x="5.5" y="11" width="13" height="9" {...p} />
        </>
      )}
      {name === 'list' && (
        <>
          <Line x1="4" y1="7" x2="20" y2="7" {...p} />
          <Line x1="4" y1="12" x2="20" y2="12" {...p} />
          <Line x1="4" y1="17" x2="20" y2="17" {...p} />
        </>
      )}
      {name === 'plus' && (
        <>
          <Circle cx="12" cy="12" r="9" {...p} />
          <Line x1="12" y1="8" x2="12" y2="16" {...p} />
          <Line x1="8" y1="12" x2="16" y2="12" {...p} />
        </>
      )}
      {name === 'plusBare' && (
        <>
          <Line x1="12" y1="5" x2="12" y2="19" {...p} />
          <Line x1="5" y1="12" x2="19" y2="12" {...p} />
        </>
      )}
      {name === 'search' && (
        <>
          <Circle cx="10.5" cy="10.5" r="6.5" {...p} />
          <Line x1="19.5" y1="19.5" x2="15.3" y2="15.3" {...p} />
        </>
      )}
      {name === 'user' && (
        <>
          <Circle cx="12" cy="8.5" r="3.5" {...p} />
          <Path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" {...p} />
        </>
      )}
      {name === 'grid' && (
        <>
          <Rect x="4" y="4" width="7" height="7" {...p} />
          <Rect x="13" y="4" width="7" height="7" {...p} />
          <Rect x="4" y="13" width="7" height="7" {...p} />
          <Rect x="13" y="13" width="7" height="7" {...p} />
        </>
      )}
      {name === 'chevronRight' && <Polyline points="9 6 15 12 9 18" {...p} />}
      {name === 'chevronLeft' && <Polyline points="15 18 9 12 15 6" {...p} />}
      {name === 'check' && <Polyline points="5 13 9 17 19 7" {...p} />}
      {name === 'close' && (
        <>
          <Line x1="6" y1="6" x2="18" y2="18" {...p} />
          <Line x1="18" y1="6" x2="6" y2="18" {...p} />
        </>
      )}
      {name === 'camera' && (
        <>
          <Rect x="3" y="7" width="18" height="13" rx="3" {...p} />
          <Path d="M9 7l1.5-3h3L15 7" {...p} />
          <Circle cx="12" cy="13.5" r="3.5" {...p} />
        </>
      )}
    </Svg>
  );
}
