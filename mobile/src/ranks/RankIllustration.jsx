// RankIllustration.jsx  v2
import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Polygon, Rect } from 'react-native-svg';

function useLoopNative({ from = 0, to = 1, duration = 1800, delay = 0 }) {
  const val = useRef(new Animated.Value(from)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(val, { toValue: to,   duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(val, { toValue: from, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return val;
}

function useLoopJS({ from = 0, to = 1, duration = 1800, delay = 0 }) {
  const val = useRef(new Animated.Value(from)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(val, { toValue: to,   duration, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(val, { toValue: from, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return val;
}

function useShimmer(delay = 0) {
  const x = useRef(new Animated.Value(-140)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(x, { toValue: 140, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(x, { toValue: -140, duration: 0, useNativeDriver: false }),
        Animated.delay(900),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return x;
}

function useOrbit({ radius = 72, duration = 3500, startAngle = 0 }) {
  const angle = useRef(new Animated.Value(startAngle)).current;
  const pos   = useRef({ x: new Animated.Value(0), y: new Animated.Value(0) }).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(angle, {
        toValue: startAngle + 360,
        duration,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );
    anim.start();

    const id = angle.addListener(({ value }) => {
      const rad = (value * Math.PI) / 180;
      pos.x.setValue(Math.cos(rad) * radius);
      pos.y.setValue(Math.sin(rad) * radius);
    });
    return () => { anim.stop(); angle.removeListener(id); };
  }, []);
  return pos;
}

function Sparkle({ x, y, size = 12, color, delay = 0, duration = 900 }) {
  const op    = useLoopNative({ from: 0,   to: 1, duration, delay });
  const scale = useLoopNative({ from: 0.2, to: 1, duration, delay });
  return (
    <Animated.View style={{
      position: 'absolute', left: x, top: y,
      width: size, height: size,
      opacity: op, transform: [{ scale }],
      zIndex: 6,
    }}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M12 0L13.8 10.2L24 12L13.8 13.8L12 24L10.2 13.8L0 12L10.2 10.2Z" fill={color} />
      </Svg>
    </Animated.View>
  );
}

function OrbitingDot({ color, radius = 76, size = 8, duration = 3800, startAngle = 0 }) {
  const pos = useOrbit({ radius, duration, startAngle });
  return (
    <Animated.View style={{
      position: 'absolute',
      top:  Animated.add(new Animated.Value(100 - size / 2), pos.y),
      left: Animated.add(new Animated.Value(100 - size / 2), pos.x),
      width: size, height: size, zIndex: 7,
    }}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M12 0L13.8 10.2L24 12L13.8 13.8L12 24L10.2 13.8L0 12L10.2 10.2Z" fill={color} />
      </Svg>
    </Animated.View>
  );
}

function OrbShell({ bgColor, glowColor, children, sparkles = [], orbDuration = 3600, shimmerDelay = 0 }) {
  const floatY     = useLoopNative({ from: 0,    to: -12,  duration: orbDuration / 2 });
  const glowOp     = useLoopNative({ from: 0.25, to: 0.72, duration: 2200 });
  const glowScale  = useLoopNative({ from: 0.92, to: 1.16, duration: 2200 });
  const innerScale = useLoopNative({ from: 1,    to: 1.04, duration: 1800, delay: 300 });
  const shimX      = useShimmer(shimmerDelay);

  return (
    <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{
        position: 'absolute',
        width: 158, height: 158, borderRadius: 79,
        backgroundColor: glowColor,
        opacity: glowOp,
        transform: [{ scale: glowScale }],
      }} />

      <Animated.View style={{
        width: 140, height: 140, borderRadius: 70,
        backgroundColor: bgColor,
        overflow: 'hidden',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: glowColor,
        shadowOffset: { width: 0, height: 22 },
        shadowOpacity: 0.6,
        shadowRadius: 28,
        elevation: 18,
        transform: [{ translateY: floatY }, { scale: innerScale }],
      }}>
        <View style={{
          position: 'absolute', top: 12, left: 14,
          width: 46, height: 46, borderRadius: 23,
          backgroundColor: 'rgba(255,255,255,0.2)',
        }} />
        <Animated.View style={{
          position: 'absolute', top: 0, bottom: 0, width: 50,
          backgroundColor: 'rgba(255,255,255,0.18)',
          left: shimX,
          transform: [{ skewX: '-18deg' }],
        }} />
        {children}
      </Animated.View>

      {sparkles.map((sp, i) => <Sparkle key={i} {...sp} />)}
    </View>
  );
}

export function SproutIllustration() {
  return (
    <OrbShell bgColor="#14532D" glowColor="#22C55E" orbDuration={3600} shimmerDelay={200}
      sparkles={[
        { x: 10, y: 22,  size: 16, color: '#86EFAC', delay: 0,    duration: 900  },
        { x: 160, y: 32, size: 12, color: '#fff',    delay: 600,  duration: 1000 },
        { x: 18, y: 148, size: 14, color: '#4ADE80', delay: 1200, duration: 1100 },
        { x: 154, y: 140, size: 18, color: '#DCFCE7', delay: 300, duration: 800  },
      ]}>
      <Svg width={72} height={72} viewBox="0 0 72 72" fill="none">
        <Path d="M36 58 Q36 40 36 32" stroke="rgba(255,255,255,0.9)" strokeWidth="3.5" strokeLinecap="round" />
        <Path d="M36 40 Q28 32 20 34 Q22 44 36 44" fill="rgba(255,255,255,0.85)" />
        <Path d="M36 32 Q44 22 52 24 Q50 34 36 36" fill="rgba(255,255,255,0.7)" />
        <Circle cx="36" cy="60" r="4" fill="rgba(255,255,255,0.5)" />
      </Svg>
    </OrbShell>
  );
}

export function StarIllustration() {
  return (
    <OrbShell bgColor="#1E3A8A" glowColor="#6366F1" orbDuration={4000} shimmerDelay={400}
      sparkles={[
        { x: 8,   y: 18,  size: 18, color: '#818CF8', delay: 0,    duration: 800  },
        { x: 162, y: 22,  size: 14, color: '#fff',    delay: 500,  duration: 1000 },
        { x: 14,  y: 150, size: 12, color: '#A5B4FC', delay: 1000, duration: 1200 },
        { x: 157, y: 145, size: 20, color: '#E0E7FF', delay: 800,  duration: 900  },
        { x: 82,  y: 4,   size: 10, color: '#fff',    delay: 1400, duration: 1100 },
      ]}>
      <Svg width={70} height={70} viewBox="0 0 70 70" fill="none">
        <Path
          d="M35 8 L40.5 26 L59 26 L44.5 37 L50 55 L35 44 L20 55 L25.5 37 L11 26 L29.5 26 Z"
          fill="rgba(255,255,255,0.95)"
        />
        <Path d="M35 8 L38 18 L35 24 L32 18 Z" fill="rgba(255,255,255,0.5)" />
      </Svg>
    </OrbShell>
  );
}

export function DiamondIllustration() {
  const pos1 = useOrbit({ radius: 76, duration: 3800, startAngle: 0   });
  const pos2 = useOrbit({ radius: 76, duration: 5200, startAngle: 180 });

  return (
    <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }}>
      <OrbShell bgColor="#881337" glowColor="#F43F5E" orbDuration={3200} shimmerDelay={0}
        sparkles={[
          { x: 5,   y: 14,  size: 16, color: '#FDA4AF', delay: 0,    duration: 900  },
          { x: 164, y: 18,  size: 14, color: '#fff',    delay: 700,  duration: 1000 },
          { x: 10,  y: 152, size: 20, color: '#FB7185', delay: 400,  duration: 800  },
          { x: 155, y: 148, size: 12, color: '#FFE4E6', delay: 1100, duration: 1200 },
          { x: 88,  y: 2,   size: 10, color: '#fff',    delay: 1600, duration: 1000 },
        ]}>
        <Svg width={72} height={72} viewBox="0 0 72 72" fill="none">
          <Polygon points="36,8 60,28 36,64 12,28" fill="rgba(255,255,255,0.92)" />
          <Polygon points="36,8 60,28 36,32 12,28" fill="rgba(255,255,255,0.5)" />
          <Polygon points="36,32 60,28 36,64"      fill="rgba(255,255,255,0.72)" />
          <Polygon points="36,32 12,28 36,64"      fill="rgba(255,255,255,0.48)" />
          <Circle cx="36" cy="8" r="3" fill="rgba(255,255,255,0.9)" />
        </Svg>
      </OrbShell>

      <Animated.View style={{
        position: 'absolute',
        top:  Animated.add(new Animated.Value(96), pos1.y),
        left: Animated.add(new Animated.Value(96), pos1.x),
        width: 10, height: 10, zIndex: 10,
      }}>
        <Svg width={10} height={10} viewBox="0 0 24 24">
          <Path d="M12 0L13.8 10.2L24 12L13.8 13.8L12 24L10.2 13.8L0 12L10.2 10.2Z" fill="#A78BFA" />
        </Svg>
      </Animated.View>
      <Animated.View style={{
        position: 'absolute',
        top:  Animated.add(new Animated.Value(97), pos2.y),
        left: Animated.add(new Animated.Value(97), pos2.x),
        width: 7, height: 7, zIndex: 10,
      }}>
        <Svg width={7} height={7} viewBox="0 0 24 24">
          <Path d="M12 0L13.8 10.2L24 12L13.8 13.8L12 24L10.2 13.8L0 12L10.2 10.2Z" fill="#fff" />
        </Svg>
      </Animated.View>
    </View>
  );
}

export function CrownIllustration() {
  const pos1 = useOrbit({ radius: 76, duration: 3500,  startAngle: 0   });
  const pos2 = useOrbit({ radius: 76, duration: 5000,  startAngle: 120 });
  const pos3 = useOrbit({ radius: 76, duration: 4200,  startAngle: 240 });

  const outerGlowOp    = useLoopNative({ from: 0.2, to: 0.55, duration: 2000, delay: 200 });
  const outerGlowScale = useLoopNative({ from: 1.0, to: 1.2,  duration: 2000, delay: 200 });

  return (
    <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{
        position: 'absolute',
        width: 178, height: 178, borderRadius: 89,
        backgroundColor: '#F59E0B',
        opacity: outerGlowOp,
        transform: [{ scale: outerGlowScale }],
      }} />

      <OrbShell bgColor="#78350F" glowColor="#F59E0B" orbDuration={3800} shimmerDelay={600}
        sparkles={[
          { x: 4,   y: 12,  size: 18, color: '#fff',    delay: 0,    duration: 800  },
          { x: 160, y: 18,  size: 14, color: '#F59E0B', delay: 600,  duration: 1000 },
          { x: 8,   y: 154, size: 16, color: '#fff',    delay: 1000, duration: 900  },
          { x: 157, y: 148, size: 22, color: '#FCD34D', delay: 400,  duration: 800  },
          { x: 84,  y: 2,   size: 12, color: '#FDE68A', delay: 1400, duration: 1100 },
          { x: 86,  y: 180, size: 10, color: '#fff',    delay: 900,  duration: 1000 },
        ]}>
        <Svg width={74} height={74} viewBox="0 0 74 74" fill="none">
          <Path d="M10 52 L10 38 L20 48 L37 18 L54 48 L64 38 L64 52 Z" fill="rgba(255,255,255,0.93)" />
          <Rect x="10" y="52" width="54" height="9" rx="3" fill="rgba(255,255,255,0.72)" />
          <Circle cx="37" cy="46" r="5"   fill="rgba(255,230,180,0.95)" />
          <Circle cx="37" cy="46" r="2.5" fill="rgba(255,255,255,0.9)" />
          <Circle cx="22" cy="51" r="3" fill="rgba(255,255,255,0.85)" />
          <Circle cx="52" cy="51" r="3" fill="rgba(255,255,255,0.85)" />
          <Circle cx="10" cy="38" r="3.5" fill="rgba(255,240,180,0.9)" />
          <Circle cx="37" cy="18" r="3.5" fill="rgba(255,240,180,0.9)" />
          <Circle cx="64" cy="38" r="3.5" fill="rgba(255,240,180,0.9)" />
        </Svg>
      </OrbShell>

      {[
        { pos: pos1, size: 10, color: '#FCD34D' },
        { pos: pos2, size: 7,  color: '#fff'    },
        { pos: pos3, size: 6,  color: '#F59E0B' },
      ].map(({ pos, size, color }, i) => (
        <Animated.View key={i} style={{
          position: 'absolute',
          top:  Animated.add(new Animated.Value(100 - size / 2), pos.y),
          left: Animated.add(new Animated.Value(100 - size / 2), pos.x),
          width: size, height: size, zIndex: 10,
        }}>
          <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M12 0L13.8 10.2L24 12L13.8 13.8L12 24L10.2 13.8L0 12L10.2 10.2Z" fill={color} />
          </Svg>
        </Animated.View>
      ))}
    </View>
  );
}

export function PencilIllustration() {
  return (
    <OrbShell bgColor="#C2410C" glowColor="#F97316" orbDuration={3800} shimmerDelay={300}
      sparkles={[
        { x: 10,  y: 20,  size: 14, color: '#FED7AA', delay: 0,    duration: 900  },
        { x: 158, y: 28,  size: 11, color: '#fff',    delay: 500,  duration: 1000 },
        { x: 16,  y: 148, size: 12, color: '#FB923C', delay: 1100, duration: 1100 },
        { x: 155, y: 142, size: 16, color: '#FFEDD5', delay: 300,  duration: 850  },
        { x: 80,  y: 4,   size: 9,  color: '#fff',    delay: 800,  duration: 1000 },
      ]}>
      <Svg width={72} height={72} viewBox="0 0 72 72" fill="none">
        {/* Карандаш — тело */}
        <Rect x="29" y="10" width="14" height="42" rx="2" fill="rgba(255,255,255,0.92)" />
        {/* Ластик сверху */}
        <Rect x="29" y="10" width="14" height="8" rx="2" fill="rgba(255,200,180,0.9)" />
        {/* Металлический обод */}
        <Rect x="29" y="17" width="14" height="4" fill="rgba(255,255,255,0.5)" />
        {/* Деревянная часть снизу */}
        <Path d="M29 52 L36 62 L43 52 Z" fill="rgba(255,220,160,0.95)" />
        {/* Грифель */}
        <Path d="M34 58 L36 64 L38 58 Z" fill="rgba(80,40,20,0.85)" />
        {/* Блик на теле */}
        <Rect x="31" y="20" width="4" height="24" rx="2" fill="rgba(255,255,255,0.3)" />
      </Svg>
    </OrbShell>
  );
}

export function ShieldIllustration() {
  const pos1 = useOrbit({ radius: 76, duration: 4200, startAngle: 60  });
  const pos2 = useOrbit({ radius: 76, duration: 5600, startAngle: 240 });

  return (
    <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }}>
      <OrbShell bgColor="#4C1D95" glowColor="#7C3AED" orbDuration={3400} shimmerDelay={150}
        sparkles={[
          { x: 6,   y: 16,  size: 15, color: '#C4B5FD', delay: 0,    duration: 900  },
          { x: 162, y: 20,  size: 12, color: '#fff',    delay: 600,  duration: 1000 },
          { x: 12,  y: 150, size: 18, color: '#A78BFA', delay: 400,  duration: 850  },
          { x: 156, y: 146, size: 11, color: '#DDD6FE', delay: 1100, duration: 1200 },
          { x: 86,  y: 3,   size: 10, color: '#fff',    delay: 1500, duration: 1000 },
        ]}>
        <Svg width={72} height={72} viewBox="0 0 72 72" fill="none">
          {/* Щит */}
          <Path d="M36 8 L58 16 L58 36 Q58 54 36 64 Q14 54 14 36 L14 16 Z"
            fill="rgba(255,255,255,0.92)" />
          {/* Внутренний слой */}
          <Path d="M36 14 L52 20 L52 36 Q52 50 36 58 Q20 50 20 36 L20 20 Z"
            fill="rgba(167,139,250,0.45)" />
          {/* Вертикальная полоса */}
          <Rect x="34" y="18" width="4" height="32" rx="2" fill="rgba(255,255,255,0.7)" />
          {/* Горизонтальная полоса */}
          <Rect x="22" y="32" width="28" height="4" rx="2" fill="rgba(255,255,255,0.7)" />
          {/* Центральный камень */}
          <Circle cx="36" cy="34" r="5" fill="rgba(221,214,254,0.95)" />
          <Circle cx="36" cy="34" r="2.5" fill="rgba(255,255,255,0.9)" />
        </Svg>
      </OrbShell>

      {[
        { pos: pos1, size: 9,  color: '#A78BFA' },
        { pos: pos2, size: 6,  color: '#fff'    },
      ].map(({ pos, size, color }, i) => (
        <Animated.View key={i} style={{
          position: 'absolute',
          top:  Animated.add(new Animated.Value(100 - size / 2), pos.y),
          left: Animated.add(new Animated.Value(100 - size / 2), pos.x),
          width: size, height: size, zIndex: 10,
        }}>
          <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M12 0L13.8 10.2L24 12L13.8 13.8L12 24L10.2 13.8L0 12L10.2 10.2Z" fill={color} />
          </Svg>
        </Animated.View>
      ))}
    </View>
  );
}

export function RankIllustration({ type }) {
  const map = {
    sprout:  <SproutIllustration  />,
    star:    <StarIllustration    />,
    pencil:  <PencilIllustration  />,
    shield:  <ShieldIllustration  />,
    crown:   <CrownIllustration   />,
  };
  return map[type] ?? null;
}
