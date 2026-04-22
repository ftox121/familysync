import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RANKS, getRankByXP } from './ranks';

export function ProfileRankBadge({ userXP = 0, onPress }) {
  const rank = getRankByXP(userXP);
  const nextRank = RANKS[rank.id + 1] ?? null;
  const progressPct = nextRank
    ? ((userXP - rank.xpMin) / (rank.xpMax - rank.xpMin)) * 100
    : 100;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={s.badge}>
      <View style={s.left}>
        <Text style={s.emoji}>{rank.emoji}</Text>
        <View>
          <Text style={s.rankName}>«{rank.name}»</Text>
          <Text style={s.hint}>
            {nextRank
              ? `До «${nextRank.name}»: ${rank.xpMax - userXP} ★`
              : 'Максимальный уровень 🎉'}
          </Text>
        </View>
      </View>
      <View style={s.right}>
        <View style={[s.pointsPill, { backgroundColor: rank.color + '14' }]}> 
          <Text
            style={[s.xp, { color: rank.color }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {userXP} ★
          </Text>
        </View>
        <Text style={[s.arrow, { color: rank.color }]}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

export function RankProgressBar({ userXP = 0 }) {
  const rank = getRankByXP(userXP);
  const progressPct = rank.xpMax
    ? ((userXP - rank.xpMin) / (rank.xpMax - rank.xpMin)) * 100
    : 100;

  return (
    <View style={s.track}>
      <View style={[s.fill, {
        width: `${Math.min(Math.max(progressPct, 2), 100)}%`,
        backgroundColor: rank.color,
      }]} />
    </View>
  );
}

const s = StyleSheet.create({
  badge: {
    backgroundColor: '#F5F3FF',
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  emoji: { fontSize: 22 },
  rankName: { fontWeight: '800', fontSize: 15, color: '#1E1B4B' },
  hint: { fontWeight: '600', fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8, flexShrink: 0 },
  pointsPill: {
    minWidth: 54,
    maxWidth: 86,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignItems: 'center',
  },
  xp: { fontWeight: '800', fontSize: 13 },
  arrow: { fontSize: 22, fontWeight: '300', marginTop: -1 },
  track: {
    height: 6, borderRadius: 3,
    backgroundColor: '#EDE9FE',
    overflow: 'hidden', marginHorizontal: 2,
  },
  fill: { height: '100%', borderRadius: 3 },
});
