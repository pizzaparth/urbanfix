import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, uf as font, ufRadius as radius } from '../theme.js';


export default function FormattedDescription({ description }) {
  if (!description) return <Text style={s.body}>No description provided.</Text>;

  const parts = description.split('[CITIZEN DESCRIPTION]');
  const questionnaireText = parts[0]?.replace('[CATEGORY QUESTIONNAIRE RESPONSES]', '').trim();
  const citizenText = parts[1]?.trim();

  // If the format is not what we expect, just render it raw
  if (!citizenText && !questionnaireText.includes('•')) {
    return <Text style={s.body}>{description}</Text>;
  }

  const qnaList = questionnaireText.split('\n').filter(l => l.trim().startsWith('•')).map(l => l.replace('•', '').trim());

  return (
    <View style={s.container}>
      {qnaList.length > 0 && (
        <View style={s.qnaCard}>
          <Text style={s.sectionLabel}>QUESTIONNAIRE</Text>
          {qnaList.map((item, index) => {
            const splitIndex = item.lastIndexOf(':');
            const q = splitIndex > -1 ? item.substring(0, splitIndex).trim() : item;
            const a = splitIndex > -1 ? item.substring(splitIndex + 1).trim() : '';
            return (
              <View key={index} style={s.qnaRow}>
                <Text style={s.questionText}>{q}</Text>
                {a ? (
                  <View style={[s.badge, a.toLowerCase() === 'yes' ? s.badgeYes : s.badgeNo]}>
                    <Text style={s.badgeText}>{a.toUpperCase()}</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
      
      {citizenText ? (
        <View style={s.citizenSection}>
          <Text style={s.sectionLabel}>CITIZEN COMMENTS</Text>
          <Text style={s.body}>{citizenText}</Text>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: { gap: 16, marginBottom: 18 },
  qnaCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  qnaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  sectionLabel: {
    fontFamily: font.bodyBold,
    fontSize: 12,
    letterSpacing: 1.1,
    color: colors.dim,
    marginBottom: 8,
  },
  questionText: {
    flex: 1,
    fontFamily: font.body,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'center',
  },
  badgeYes: { backgroundColor: 'rgba(255,95,162,0.15)' },
  badgeNo: { backgroundColor: 'rgba(181,168,178,0.1)' },
  badgeText: {
    fontFamily: font.bodyBold,
    fontSize: 12,
    color: colors.accent,
  },
  citizenSection: {
    paddingTop: 4,
  },
  body: { 
    fontFamily: font.body, 
    fontSize: 16, 
    lineHeight: 24, 
    color: colors.body 
  },
});
