// See docs/02-ux-flows-and-wireframes.md § 4.

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../theme';
import { useCalendarMonth } from '../lib/useCalendarMonth';
import { buildMonthGrid, WEEKDAY_LABELS, MONTH_NAMES } from '../lib/monthGrid';
import { FilmStripCell } from '../components/calendar/FilmStripCell';
import { GrainOverlay } from '../components/ui/GrainOverlay';

export default function CalendarScreen({ navigation, userId, pairId }: any) {
  const theme = useTheme();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const { summaries, seasonTitle } = useCalendarMonth(year, month);
  const cells = buildMonthGrid(year, month);
  const todayKey = today.toISOString().slice(0, 10);

  function changeMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bgCanvas }]}>
      <GrainOverlay />
      <View style={styles.header}>
        <Text style={[theme.type.displaySm, { color: theme.colors.textPrimary }]}>
          {seasonTitle ?? MONTH_NAMES[month - 1]}
        </Text>
        <View style={styles.nav}>
          <Pressable onPress={() => changeMonth(-1)}>
            <Text style={[theme.type.body, { color: theme.colors.textTertiary }]}>‹</Text>
          </Pressable>
          <Text style={[theme.type.caption, { color: theme.colors.textTertiary, marginHorizontal: 10 }]}>
            {MONTH_NAMES[month - 1]} {year}
          </Text>
          <Pressable onPress={() => changeMonth(1)}>
            <Text style={[theme.type.body, { color: theme.colors.textTertiary }]}>›</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <Text key={i} style={[theme.type.caption, styles.weekdayCell, { color: theme.colors.textTertiary }]}>
            {label}
          </Text>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {cells.map((cell) => {
          const summary = summaries[cell.day];
          const isToday = cell.day === todayKey;
          return (
            <Pressable
              key={cell.day}
              disabled={!summary}
              onPress={() => navigation.navigate('DayDetail', { day: cell.day, userId, pairId })}
              style={[
                styles.cell,
                isToday && { backgroundColor: theme.colors.accentMuted },
                !cell.inMonth && { opacity: 0.35 },
              ]}
            >
              <Text style={[theme.type.body, { color: theme.colors.textSecondary, fontSize: 12 }]}>{cell.dateNum}</Text>
              {summary && <FilmStripCell count={summary.memory_count} />}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 18, paddingHorizontal: 20, alignItems: 'center' },
  nav: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  weekRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 14 },
  weekdayCell: { flex: 1, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
});
