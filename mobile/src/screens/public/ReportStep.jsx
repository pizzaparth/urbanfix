import React from 'react';
import { View, Text, Image, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { CATEGORIES } from '../../constants/categories.js';
import { color, font } from '../../theme.js';
import { X, Camera, ImagePlus, CheckCircle2 } from 'lucide-react-native';

const PRIORITY_BG = {
  'High Urgency': '#FF5A7A',
  'Medium Urgency': '#FFB86B',
  'Standard Urgency': '#4ADE9B',
};

const ReportStep = ({
  card,
  cardIndex,
  category,
  onSelectCategory,
  answers,
  onToggleAnswer,
  urgency,
  formData,
  onInputChange,
  files,
  onPickFromCamera,
  onPickFromLibrary,
  onRemoveFile,
  onNext,
  onBack,
  submittingForm,
  onSubmit,
}) => {
  const showBack = cardIndex > 0;

  if (card.type === 'category') {
    return (
      <View style={s.container}>
        <Text style={s.bigTitle}>What's the issue?</Text>
        <View style={s.categoryList}>
          {CATEGORIES.map((cat) => {
            const active = category === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => onSelectCategory(cat)}
                style={({ pressed }) => [
                  s.catBtn,
                  { borderColor: active ? color.accent : '#2C222B' },
                  pressed && { transform: [{ scale: 0.98 }] },
                ]}
              >
                <Text style={s.catLabel}>{cat}</Text>
                {active && (
                  <CheckCircle2 size={24} strokeWidth={3} color={color.accent} />
                )}
              </Pressable>
            );
          })}
        </View>
        <Pressable style={s.nextBtn} onPress={onNext}>
          <Text style={s.nextBtnText}>Next</Text>
        </Pressable>
      </View>
    );
  }

  if (card.type === 'question') {
    const q = card.question;
    const total = card.totalQuestions;
    const current = card.questionIndex;

    return (
      <View style={s.container}>
        <View style={s.dotsRow}>
          {Array.from({ length: total }).map((_, i) => (
            <View key={i} style={[s.dot, i === current ? s.dotActive : null]} />
          ))}
        </View>

        <View style={s.questionCard}>
          <Text style={s.qCatLabel}>{category}</Text>
          <Text style={s.qText}>{q.question}</Text>
        </View>

        <View style={s.qActionRow}>
          <Pressable style={[s.qBtn, s.qBtnNo]} onPress={() => { onToggleAnswer(q.id, 'No'); onNext(); }}>
            <X size={26} strokeWidth={2.8} color="#FF5A7A" />
          </Pressable>
          <Pressable style={[s.qBtn, s.qBtnYes]} onPress={() => { onToggleAnswer(q.id, 'Yes'); onNext(); }}>
            <CheckCircle2 size={29} strokeWidth={3.2} color="#06140D" />
          </Pressable>
        </View>

        <View style={s.urgencyRow}>
          <View style={[s.urgencyDot, { backgroundColor: PRIORITY_BG[urgency.level] }]} />
          <Text style={s.urgencyText}>Priority <Text style={{ color: PRIORITY_BG[urgency.level], fontFamily: font.sansBold }}>{urgency.level}</Text></Text>
        </View>
      </View>
    );
  }

  if (card.type === 'title' || card.type === 'description' || card.type === 'location') {
    // we combine them into details! Wait, the cards array has them separate.
    // In the HTML it is combined: fIsDetails.
    // If we want to strictly match HTML, we should show all 3 when card.type is 'title'.
    // Let's just render the 'title' one as the unified details page.
    if (card.type === 'title') {
      return (
        <View style={s.container}>
          <Text style={s.bigTitle}>Describe it</Text>
          <View style={s.formGroup}>
            <View>
              <Text style={s.inputLabel}>Title</Text>
              <TextInput
                value={formData.title}
                onChangeText={(v) => onInputChange('title', v)}
                placeholder="e.g. Pothole near bus stop"
                placeholderTextColor="rgba(255,255,255,0.4)"
                style={s.giantInput}
              />
            </View>
            <View>
              <Text style={s.inputLabel}>Details</Text>
              <TextInput
                value={formData.description}
                onChangeText={(v) => onInputChange('description', v)}
                placeholder="What did you see?"
                placeholderTextColor="rgba(255,255,255,0.4)"
                multiline
                style={[s.giantInput, s.textArea]}
              />
            </View>
            <View>
              <Text style={s.inputLabel}>Location</Text>
              <TextInput
                value={formData.location}
                onChangeText={(v) => onInputChange('location', v)}
                placeholder="Ward, street or landmark"
                placeholderTextColor="rgba(255,255,255,0.4)"
                style={s.giantInput}
              />
            </View>
          </View>
          
          <View style={s.navRow}>
            {showBack && <Pressable style={s.backBtn} onPress={onBack}><Text style={s.backBtnText}>Back</Text></Pressable>}
            <Pressable style={s.nextBtnFlex} onPress={() => {
              // skip description and location cards
              onNext(); onNext(); onNext();
            }}><Text style={s.nextBtnText}>Next</Text></Pressable>
          </View>
        </View>
      );
    }
    return null; // Skip rendering separate cards for description and location
  }

  if (card.type === 'upload') {
    return (
      <View style={s.container}>
        <Text style={s.bigTitle}>Add photos</Text>
        <Text style={s.subTitle}>Optional — up to 3</Text>
        
        <View style={s.uploadGrid}>
          <Pressable style={[s.uploadBox, s.uploadBoxMain]} onPress={onPickFromCamera}>
            <Camera size={32} color="#3B2E3A" />
            <Text style={s.uploadMeta}>Take Photo</Text>
          </Pressable>
          <View style={s.uploadRow}>
            <Pressable style={[s.uploadBox, s.uploadBoxSmall]} onPress={onPickFromLibrary}>
              <ImagePlus size={24} color="#3B2E3A" />
              <Text style={s.uploadMeta}>Library</Text>
            </Pressable>
            <View style={s.uploadPreviewContainer}>
              {files.slice(0,2).map((f, i) => (
                <View key={i} style={s.uploadPreviewBox}>
                  <Image source={{ uri: f.uri }} style={s.previewImg} />
                  <Pressable style={s.removeBtn} onPress={() => onRemoveFile(i)}>
                    <X size={14} color="#FFF" />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        </View>
        <Text style={s.photoHint}>Photos speed up triage.</Text>
        
        <View style={[s.navRow, {marginTop: 30}]}>
          {showBack && <Pressable style={s.backBtn} onPress={() => {
            // go back to title card
            onBack(); onBack(); onBack();
          }}><Text style={s.backBtnText}>Back</Text></Pressable>}
          <Pressable style={s.nextBtnFlex} onPress={onNext}><Text style={s.nextBtnText}>Next</Text></Pressable>
        </View>
      </View>
    );
  }

  // Combine name, email, phone into one contact page
  if (card.type === 'name') {
    return (
      <View style={s.container}>
        <Text style={s.bigTitle}>Your contact</Text>
        
        <View style={s.formGroup}>
          <View>
            <Text style={s.inputLabel}>Full name</Text>
            <TextInput
              value={formData.name}
              onChangeText={(v) => onInputChange('name', v)}
              placeholder="Your name"
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={s.giantInput}
            />
          </View>
          <View>
            <Text style={s.inputLabel}>Email</Text>
            <TextInput
              value={formData.email}
              onChangeText={(v) => onInputChange('email', v)}
              placeholder="you@example.com"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="email-address"
              autoCapitalize="none"
              style={s.giantInput}
            />
          </View>
          <View>
            <Text style={s.inputLabel}>Phone (optional)</Text>
            <TextInput
              value={formData.phone}
              onChangeText={(v) => onInputChange('phone', v)}
              placeholder="9876543210"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="number-pad"
              style={s.giantInput}
            />
          </View>
        </View>
        
        <View style={[s.navRow, {marginTop: 30}]}>
          {showBack && <Pressable style={s.backBtn} onPress={onBack}><Text style={s.backBtnText}>Back</Text></Pressable>}
          <Pressable style={s.nextBtnFlex} onPress={() => {
            onNext(); onNext(); onNext();
          }}><Text style={s.nextBtnText}>Next</Text></Pressable>
        </View>
      </View>
    );
  }
  
  if (card.type === 'email' || card.type === 'phone') return null;

  if (card.type === 'review') {
    return (
      <View style={s.container}>
        <Text style={s.bigTitle}>Review</Text>
        <View style={s.reviewCard}>
          <View style={s.reviewRow}>
            <Text style={s.reviewLabel}>Category</Text>
            <Text style={s.reviewVal}>{formData.category}</Text>
          </View>
          <View style={s.reviewRow}>
            <Text style={s.reviewLabel}>Priority</Text>
            <Text style={[s.reviewVal, { color: PRIORITY_BG[urgency.level] }]}>{urgency.level}</Text>
          </View>
          <View style={s.reviewRow}>
            <Text style={s.reviewLabel}>Subject</Text>
            <Text style={s.reviewVal}>{formData.title}</Text>
          </View>
          <View style={s.reviewRow}>
            <Text style={s.reviewLabel}>Location</Text>
            <Text style={s.reviewVal}>{formData.location}</Text>
          </View>
          <View style={s.reviewRow}>
            <Text style={s.reviewLabel}>Name</Text>
            <Text style={s.reviewVal}>{formData.name}</Text>
          </View>
        </View>
        
        <View style={[s.navRow, {marginTop: 30}]}>
          {showBack && <Pressable style={s.backBtn} onPress={() => {
            onBack(); onBack(); onBack();
          }}><Text style={s.backBtnText}>Back</Text></Pressable>}
          <Pressable style={s.submitBtnFlex} onPress={onSubmit} disabled={submittingForm}>
            <Text style={s.submitBtnText}>{submittingForm ? '...' : 'Request OTP'}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return null;
};

const s = StyleSheet.create({
  container: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  bigTitle: {
    fontFamily: font.sansBold,
    fontSize: 30,
    lineHeight: 33,
    color: color.white,
    marginBottom: 22,
  },
  subTitle: {
    fontSize: 17,
    fontFamily: font.sansBold,
    color: color.white,
    opacity: 0.6,
    marginBottom: 20,
    marginTop: -14,
  },
  categoryList: {
    gap: 12,
  },
  catBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 20,
    paddingHorizontal: 22,
    borderRadius: 22,
    backgroundColor: '#120E13',
    borderWidth: 2,
  },
  catLabel: {
    fontFamily: font.sansBold,
    fontSize: 20,
    color: color.white,
  },
  nextBtn: {
    marginTop: 30,
    height: 60,
    borderRadius: 30,
    backgroundColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    fontFamily: font.sansBold,
    fontSize: 18,
    color: '#1C0512',
  },
  
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 18,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    width: 20,
    backgroundColor: color.white,
  },
  
  questionCard: {
    minHeight: 380,
    paddingVertical: 44,
    paddingHorizontal: 28,
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
  },
  qCatLabel: {
    fontSize: 14,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: color.white,
    fontFamily: font.sansBold,
    opacity: 0.7,
  },
  qText: {
    fontFamily: font.sansBold,
    fontSize: 34,
    lineHeight: 38,
    color: color.white,
    textAlign: 'center',
  },
  
  qActionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 26,
    marginTop: 22,
  },
  qBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qBtnNo: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF5A7A',
  },
  qBtnYes: {
    backgroundColor: '#4ADE9B',
  },
  
  urgencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  urgencyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  urgencyText: {
    fontSize: 13,
    color: color.textSecondary,
    fontFamily: font.sans,
  },
  
  formGroup: {
    gap: 22,
  },
  inputLabel: {
    fontSize: 17,
    fontFamily: font.sansBold,
    color: color.white,
    marginBottom: 10,
  },
  giantInput: {
    width: '100%',
    height: 60,
    paddingHorizontal: 18,
    backgroundColor: '#120E13',
    borderWidth: 1.5,
    borderColor: '#2C222B',
    borderRadius: 18,
    color: color.white,
    fontSize: 18,
    fontFamily: font.sansBold,
  },
  textArea: {
    height: 120,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  
  uploadGrid: {
    gap: 12,
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: '#3B2E3A',
    borderStyle: 'dashed',
    backgroundColor: '#0D0A0D',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  uploadBoxMain: {
    height: 210,
    borderRadius: 24,
  },
  uploadRow: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadBoxSmall: {
    flex: 1,
    height: 130,
    borderRadius: 22,
  },
  uploadPreviewContainer: {
    flex: 1,
    height: 130,
    flexDirection: 'row',
    gap: 12,
  },
  uploadPreviewBox: {
    flex: 1,
    height: '100%',
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImg: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF5A7A',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadMeta: {
    color: '#8E8290',
    fontFamily: font.sansBold,
    fontSize: 13,
  },
  photoHint: {
    fontSize: 15,
    fontFamily: font.sansBold,
    color: color.white,
    opacity: 0.6,
    marginTop: 18,
  },
  
  navRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backBtn: {
    height: 60,
    paddingHorizontal: 24,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#2C222B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontFamily: font.sansBold,
    fontSize: 18,
    color: color.white,
  },
  nextBtnFlex: {
    flex: 1,
    height: 60,
    borderRadius: 30,
    backgroundColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnFlex: {
    flex: 1,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4ADE9B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontFamily: font.sansBold,
    fontSize: 18,
    color: '#06140D',
  },
  
  reviewCard: {
    backgroundColor: '#120E13',
    borderWidth: 1,
    borderColor: '#2C222B',
    borderRadius: 22,
    padding: 20,
    gap: 16,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#231B22',
    paddingBottom: 16,
  },
  reviewLabel: {
    fontFamily: font.sans,
    fontSize: 13,
    color: color.textSecondary,
  },
  reviewVal: {
    fontFamily: font.sansBold,
    fontSize: 14,
    color: color.white,
    textAlign: 'right',
    maxWidth: '70%',
  },
});

export default ReportStep;
