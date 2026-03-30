import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'
import { Users, Copy, Check, LogOut } from 'lucide-react-native'
import * as Clipboard from 'expo-clipboard'
import Toast from 'react-native-toast-message'
import { base44 } from '../api/base44Client'
import { useFamilyContext } from '../context/FamilyContext'
import { ROLE_LABELS, getLevel, getLevelProgress } from '../lib/utils'
import { Colors, Radius, Spacing, FontSize } from '../lib/theme'
import MemberAvatar from '../components/MemberAvatar'
import LeaderBoard from '../components/LeaderBoard'

export default function Profile() {
  const { user, family, currentMembership, members, tasks, isLoading } = useFamilyContext()
  const [copied, setCopied] = useState(false)

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  const level         = getLevel(currentMembership?.points)
  const levelProgress = getLevelProgress(currentMembership?.points)
  const myTasks       = tasks.filter((t: any) => t.assigned_to === user?.email)
  const myCompleted   = myTasks.filter((t: any) => t.status === 'completed').length

  const handleCopy = async () => {
    await Clipboard.setStringAsync(family?.invite_code ?? '')
    setCopied(true)
    Toast.show({ type: 'success', text1: 'Код скопирован!' })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLogout = async () => {
    await base44.auth.logout()
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Animated.View entering={FadeIn} style={styles.header}>
        <Text style={styles.pageTitle}>Профиль</Text>
      </Animated.View>

      {/* User card */}
      <View style={styles.userCard}>
        <View style={styles.userRow}>
          <MemberAvatar
            name={currentMembership?.display_name ?? user?.full_name}
            color={currentMembership?.avatar_color}
            size="xl"
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {currentMembership?.display_name ?? user?.full_name}
            </Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {ROLE_LABELS[currentMembership?.role] ?? 'Участник'}
              </Text>
            </View>
            {/* Level progress */}
            <View style={styles.levelRow}>
              <Text style={styles.levelLabel}>Уровень {level}</Text>
              <Text style={styles.pointsLabel}>⭐ {currentMembership?.points ?? 0} баллов</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${levelProgress}%` }]} />
            </View>
            <Text style={styles.nextLevel}>
              {100 - ((currentMembership?.points ?? 0) % 100)} до следующего уровня
            </Text>
          </View>
        </View>
      </View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: Colors.primary }]}>{myTasks.length}</Text>
          <Text style={styles.statLabel}>Всего задач</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: Colors.green }]}>{myCompleted}</Text>
          <Text style={styles.statLabel}>Выполнено</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: Colors.amber }]}>{currentMembership?.points ?? 0}</Text>
          <Text style={styles.statLabel}>Баллов</Text>
        </View>
      </View>

      {/* Family block */}
      <View style={styles.familyCard}>
        <View style={styles.familyHeader}>
          <View style={styles.familyNameRow}>
            <Users size={16} color={Colors.foreground} />
            <Text style={styles.familyName}>{family?.name}</Text>
          </View>
          <View style={styles.membersBadge}>
            <Text style={styles.membersBadgeText}>{members.length} участников</Text>
          </View>
        </View>

        {/* Invite code */}
        <View style={styles.codeRow}>
          <View style={styles.codeInfo}>
            <Text style={styles.codeLabel}>КОД ПРИГЛАШЕНИЯ</Text>
            <Text style={styles.code}>{family?.invite_code}</Text>
          </View>
          <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
            {copied
              ? <Check size={18} color={Colors.green} />
              : <Copy size={18} color={Colors.foreground} />
            }
          </TouchableOpacity>
        </View>

        {/* Members list */}
        <View style={styles.membersList}>
          {members.map((m: any) => (
            <View key={m.id} style={styles.memberItem}>
              <MemberAvatar name={m.display_name} color={m.avatar_color} size="sm" />
              <View>
                <Text style={styles.memberName}>{m.display_name}</Text>
                <Text style={styles.memberRole}>{ROLE_LABELS[m.role]}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Leaderboard */}
      <LeaderBoard members={members} />

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <LogOut size={18} color={Colors.foreground} />
        <Text style={styles.logoutText}>Выйти</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, paddingBottom: 100, gap: Spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  header: { paddingTop: Spacing.sm },
  pageTitle: { fontSize: FontSize.xxxl, fontWeight: '700', color: Colors.foreground },

  userCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.xl,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  userRow: { flexDirection: 'row', gap: Spacing.lg },
  userInfo: { flex: 1 },
  userName: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.foreground },
  roleBadge: {
    alignSelf: 'flex-start', backgroundColor: Colors.muted,
    borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4, marginTop: 6,
  },
  roleText: { fontSize: FontSize.sm, color: Colors.mutedFg },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.md },
  levelLabel: { fontSize: FontSize.sm, color: Colors.mutedFg },
  pointsLabel: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.amber },
  progressTrack: {
    height: 8, backgroundColor: Colors.muted, borderRadius: Radius.full,
    overflow: 'hidden', marginTop: 6,
  },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: Radius.full },
  nextLevel: { fontSize: FontSize.xs, color: Colors.mutedFg, marginTop: 4 },

  statsGrid: { flexDirection: 'row', gap: Spacing.md },
  statCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  statNum: { fontSize: FontSize.xxl, fontWeight: '700' },
  statLabel: { fontSize: FontSize.xs, color: Colors.mutedFg, marginTop: 2 },

  familyCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.md,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  familyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  familyNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  familyName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.foreground },
  membersBadge: {
    backgroundColor: Colors.muted, borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.border,
  },
  membersBadgeText: { fontSize: FontSize.sm, color: Colors.mutedFg },

  codeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.muted, borderRadius: Radius.md, padding: Spacing.md,
  },
  codeInfo: {},
  codeLabel: { fontSize: FontSize.xs, color: Colors.mutedFg, letterSpacing: 1, textTransform: 'uppercase' },
  code: { fontSize: FontSize.xxl, fontWeight: '700', fontFamily: 'monospace', letterSpacing: 4, color: Colors.foreground },
  copyBtn: { padding: 8, borderRadius: Radius.sm, backgroundColor: Colors.card },

  membersList: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  memberItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.muted, borderRadius: Radius.md, paddingHorizontal: 10, paddingVertical: 6,
  },
  memberName: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.foreground },
  memberRole: { fontSize: FontSize.xs, color: Colors.mutedFg },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingVertical: 14,
    backgroundColor: Colors.card,
  },
  logoutText: { fontSize: FontSize.md, fontWeight: '500', color: Colors.foreground },
})
