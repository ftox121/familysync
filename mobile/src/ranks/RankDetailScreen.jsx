import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, SafeAreaView,
} from 'react-native';
import { RankIllustration } from './RankIllustration';
import { RANKS } from './ranks';

const { width: SW } = Dimensions.get('window');

export default function RankDetailScreen({ route, navigation }) {
  const { userXP = 0 } = route.params ?? {};
  const [rankIndex, setRankIndex] = useState(route.params?.rankIndex ?? 0);

  const rank = RANKS[rankIndex];
  const userRankIndex = RANKS.findIndex(r => userXP >= r.xpMin && (r.xpMax === null || userXP < r.xpMax));
  const isCurrentRank = rankIndex === userRankIndex;
  const isUnlocked = rankIndex <= userRankIndex;

  const progressPct = isCurrentRank && rank.xpMax
    ? ((userXP - rank.xpMin) / (rank.xpMax - rank.xpMin)) * 100
    : isUnlocked ? 100 : 0;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={[s.backArrow, { color: rank.color }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[s.counter, { color: rank.color }]}>
            {rankIndex + 1} / {RANKS.length}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Progress dots */}
        <View style={s.dots}>
          {RANKS.map((r, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setRankIndex(i)}
              style={[
                s.dot,
                { flex: i === rankIndex ? 2 : 1 },
                { backgroundColor: i <= rankIndex ? rank.color : '#D1D5DB' },
              ]}
            />
          ))}
        </View>

        {/* Title */}
        <Text style={s.rankName}>{rank.name}</Text>
        {!isUnlocked && (
          <View style={s.lockedBadge}>
            <Text style={s.lockedText}>🔒 Заблокировано</Text>
          </View>
        )}

        {/* Illustration */}
        <View style={s.illustrationWrap}>
          <RankIllustration type={rank.type} />
        </View>

        {/* Perks card */}
        <View style={s.perksCard}>
          <Text style={s.perksTitle}>Привилегии уровня</Text>

          {rank.perks.map((p, i) => (
            <View key={i} style={[s.perkRow, i < rank.perks.length - 1 && s.perkBorder]}>
              <View style={[s.perkIcon, { backgroundColor: rank.color + '22' }]}>
                <Text style={{ color: rank.color, fontSize: 13, fontWeight: '800' }}>✓</Text>
              </View>
              <Text style={s.perkText}>{p}</Text>
            </View>
          ))}

          {rank.locked.length > 0 && (
            <>
              <View style={s.divider} />
              {rank.locked.map((p, i) => (
                <View key={i} style={[s.perkRow, { opacity: 0.4 }, i > 0 && s.perkBorder]}>
                  <View style={[s.perkIcon, { backgroundColor: '#F3F4F6' }]}>
                    <Text style={{ fontSize: 13 }}>🔒</Text>
                  </View>
                  <Text style={[s.perkText, { color: '#6B7280' }]}>{p}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Nav buttons */}
        <View style={s.navBtns}>
          {rankIndex > 0 && (
            <TouchableOpacity
              onPress={() => setRankIndex(i => i - 1)}
              style={[s.navBtn, s.navBtnOutline, { borderColor: rank.color + '55' }]}
            >
              <Text style={[s.navBtnText, { color: rank.color }]}>← Назад</Text>
            </TouchableOpacity>
          )}
          {rankIndex < RANKS.length - 1 && (
            <TouchableOpacity
              onPress={() => setRankIndex(i => i + 1)}
              style={[s.navBtn, { backgroundColor: rank.color, flex: 1,
                shadowColor: rank.color, shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
              }]}
            >
              <Text style={[s.navBtnText, { color: '#fff' }]}>Следующий →</Text>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0FF' },
  scroll: { paddingBottom: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
  },
  backArrow: { fontSize: 28, lineHeight: 36, fontWeight: '300', marginTop: -2 },
  counter: { fontFamily: 'System', fontWeight: '700', fontSize: 16 },
  dots: { flexDirection: 'row', gap: 8, paddingHorizontal: 32, marginVertical: 14 },
  dot: { height: 6, borderRadius: 3 },
  rankName: {
    fontWeight: '900', fontSize: 36, color: '#1E1B4B',
    textAlign: 'center', paddingHorizontal: 24, lineHeight: 42,
  },
  lockedBadge: {
    alignSelf: 'center', marginTop: 8,
    backgroundColor: '#F3F4F6', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 4,
  },
  lockedText: { fontWeight: '700', fontSize: 13, color: '#9CA3AF' },
  xpRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 32, marginTop: 16,
  },
  xpLabel: { fontWeight: '700', fontSize: 13 },
  progressTrack: {
    height: 6, borderRadius: 3, backgroundColor: '#E5E7EB',
    marginHorizontal: 32, marginTop: 6, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  illustrationWrap: { alignItems: 'center', marginVertical: 20 },
  progressHint: { color: '#9CA3AF', fontWeight: '600', fontSize: 13 },
  progressValue: { fontWeight: '900', fontSize: 28, color: '#1E1B4B' },
  perksCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20, marginHorizontal: 20,
    padding: 20,
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  perksTitle: {
    fontWeight: '800', fontSize: 13, color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14,
  },
  perkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10,
  },
  perkBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  perkIcon: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  perkText: { fontWeight: '600', fontSize: 15, color: '#1E1B4B', flex: 1 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 6 },
  navBtns: { flexDirection: 'row', gap: 12, marginHorizontal: 20, marginTop: 16 },
  navBtn: {
    flex: 1, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  navBtnOutline: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1.5,
  },
  navBtnText: { fontWeight: '800', fontSize: 15 },
});
