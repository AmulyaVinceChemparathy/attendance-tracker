import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  ActivityIndicator,
  Portal,
  Modal,
  TextInput,
  RadioButton,
  Chip,
} from 'react-native-paper';
import { api } from '../lib/api';
import { theme } from '../styles/theme';

const REASONS = [
  'health',
  'program',
  'travel',
  'public_holiday',
  'no_class',
  'strike',
  'other'
];

export default function DailyScreen() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingClass, setEditingClass] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    attended: true,
    reasonCategory: 'health',
    reasonText: '',
  });

  useEffect(() => {
    loadClasses(selectedDate);
  }, [selectedDate]);

  const loadClasses = async (date) => {
    try {
      const response = await api(`/daily?date=${date}`);
      setClasses(response.classes || []);
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClasses(selectedDate);
    setRefreshing(false);
  };

  const markAttendance = async (classData, attended, reasonCategory, reasonText) => {
    try {
      await api('/attendance', {
        method: 'POST',
        body: {
          classId: classData.id,
          date: selectedDate,
          attended,
          reasonCategory,
          reasonText,
        },
      });
      await loadClasses(selectedDate);
    } catch (error) {
      Alert.alert('Error', 'Failed to mark attendance');
    }
  };

  const updateAttendance = async (recordId, attended, reasonCategory, reasonText) => {
    try {
      await api('/attendance', {
        method: 'PUT',
        body: {
          id: recordId,
          attended,
          reasonCategory,
          reasonText,
        },
      });
      await loadClasses(selectedDate);
      setShowEditModal(false);
      setEditingClass(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update attendance');
    }
  };

  const startEdit = (classData) => {
    setEditingClass(classData);
    setEditForm({
      attended: classData.attendance?.attended ?? true,
      reasonCategory: classData.attendance?.reason_category ?? 'health',
      reasonText: classData.attendance?.reason_text ?? '',
    });
    setShowEditModal(true);
  };

  const getStatusColor = (attended) => {
    return attended ? theme.colors.success : theme.colors.error;
  };

  const getStatusText = (attended) => {
    return attended ? 'Present' : 'Absent';
  };

  const getReasonText = (reason) => {
    const reasonMap = {
      health: 'Health',
      program: 'Program',
      travel: 'Travel',
      public_holiday: 'Public Holiday',
      no_class: 'No Class',
      strike: 'Strike',
      other: 'Other'
    };
    return reasonMap[reason] || reason;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading today's classes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Daily Attendance</Text>
          <Text style={styles.subtitle}>
            {formatDate(selectedDate)}
          </Text>
        </View>

        <View style={styles.dateContainer}>
          <TextInput
            label="Select Date"
            value={selectedDate}
            onChangeText={setSelectedDate}
            mode="outlined"
            style={styles.dateInput}
            placeholder="YYYY-MM-DD"
          />
        </View>

        {classes.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Text style={styles.emptyText}>No classes scheduled for this day</Text>
              <Text style={styles.emptySubtext}>
                Check your timetable or select a different date
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.classesContainer}>
            {classes.map((classData) => (
              <Card key={classData.id} style={styles.classCard}>
                <Card.Content>
                  <View style={styles.classHeader}>
                    <Text style={styles.classSubject}>{classData.subject}</Text>
                    <Text style={styles.classTime}>
                      {classData.start_time} - {classData.end_time}
                    </Text>
                  </View>
                  
                  <Text style={styles.classTeacher}>{classData.teacher}</Text>
                  {classData.location && (
                    <Text style={styles.classLocation}>{classData.location}</Text>
                  )}

                  {classData.attendance ? (
                    <View style={styles.attendanceStatus}>
                      <View style={styles.statusRow}>
                        <Text style={styles.statusLabel}>Status:</Text>
                        <Chip
                          style={[
                            styles.statusChip,
                            { backgroundColor: getStatusColor(classData.attendance.attended) }
                          ]}
                          textStyle={styles.statusChipText}
                        >
                          {getStatusText(classData.attendance.attended)}
                        </Chip>
                      </View>
                      
                      {!classData.attendance.attended && classData.attendance.reason_category && (
                        <View style={styles.reasonContainer}>
                          <Text style={styles.reasonLabel}>Reason:</Text>
                          <Chip style={styles.reasonChip}>
                            {getReasonText(classData.attendance.reason_category)}
                          </Chip>
                        </View>
                      )}
                      
                      {!classData.attendance.attended && classData.attendance.reason_text && (
                        <Text style={styles.reasonText}>
                          "{classData.attendance.reason_text}"
                        </Text>
                      )}
                      
                      <Button
                        mode="outlined"
                        onPress={() => startEdit(classData)}
                        style={styles.editButton}
                      >
                        Edit
                      </Button>
                    </View>
                  ) : (
                    <View style={styles.attendanceActions}>
                      <Text style={styles.attendanceQuestion}>Mark your attendance:</Text>
                      <View style={styles.actionButtons}>
                        <Button
                          mode="contained"
                          onPress={() => markAttendance(classData, true)}
                          style={[styles.actionButton, styles.presentButton]}
                          icon="check"
                        >
                          Present
                        </Button>
                        <Button
                          mode="outlined"
                          onPress={() => startEdit(classData)}
                          style={[styles.actionButton, styles.absentButton]}
                          icon="close"
                        >
                          Absent
                        </Button>
                      </View>
                    </View>
                  )}
                </Card.Content>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      <Portal>
        <Modal
          visible={showEditModal}
          onDismiss={() => setShowEditModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <ScrollView>
            <Text style={styles.modalTitle}>Edit Attendance</Text>
            
            <Text style={styles.classInfo}>
              {editingClass?.subject} • {editingClass?.teacher}
            </Text>
            <Text style={styles.classTime}>
              {editingClass?.start_time} - {editingClass?.end_time}
            </Text>

            <Text style={styles.sectionLabel}>Status:</Text>
            <View style={styles.radioGroup}>
              <View style={styles.radioOption}>
                <RadioButton
                  value="present"
                  status={editForm.attended ? 'checked' : 'unchecked'}
                  onPress={() => setEditForm({ ...editForm, attended: true })}
                />
                <Text style={styles.radioLabel}>Present</Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton
                  value="absent"
                  status={!editForm.attended ? 'checked' : 'unchecked'}
                  onPress={() => setEditForm({ ...editForm, attended: false })}
                />
                <Text style={styles.radioLabel}>Absent</Text>
              </View>
            </View>

            {!editForm.attended && (
              <>
                <Text style={styles.sectionLabel}>Reason Category:</Text>
                <View style={styles.reasonChips}>
                  {REASONS.map((reason) => (
                    <Chip
                      key={reason}
                      selected={editForm.reasonCategory === reason}
                      onPress={() => setEditForm({ ...editForm, reasonCategory: reason })}
                      style={styles.reasonChip}
                    >
                      {getReasonText(reason)}
                    </Chip>
                  ))}
                </View>

                <TextInput
                  label="Additional Details"
                  value={editForm.reasonText}
                  onChangeText={(text) => setEditForm({ ...editForm, reasonText: text })}
                  mode="outlined"
                  multiline
                  style={styles.input}
                  placeholder="Optional additional details..."
                />
              </>
            )}

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setShowEditModal(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={() => updateAttendance(
                  editingClass?.attendance?.id,
                  editForm.attended,
                  editForm.reasonCategory,
                  editForm.reasonText
                )}
                style={styles.modalButton}
              >
                Save Changes
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    ...theme.typography.caption,
    marginTop: theme.spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
  },
  title: {
    ...theme.typography.h1,
    color: 'white',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  dateContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  dateInput: {
    backgroundColor: 'white',
  },
  emptyCard: {
    margin: theme.spacing.lg,
  },
  emptyContent: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    ...theme.typography.h3,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    ...theme.typography.caption,
    textAlign: 'center',
  },
  classesContainer: {
    padding: theme.spacing.lg,
    paddingTop: 0,
  },
  classCard: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  classSubject: {
    ...theme.typography.h3,
    flex: 1,
  },
  classTime: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  classTeacher: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  classLocation: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  attendanceStatus: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statusLabel: {
    ...theme.typography.body,
    fontWeight: '500',
    marginRight: theme.spacing.sm,
  },
  statusChip: {
    borderRadius: theme.roundness / 2,
  },
  statusChipText: {
    color: 'white',
    fontWeight: 'bold',
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  reasonLabel: {
    ...theme.typography.caption,
    marginRight: theme.spacing.sm,
  },
  reasonChip: {
    backgroundColor: theme.colors.surface,
  },
  reasonText: {
    ...theme.typography.caption,
    fontStyle: 'italic',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  editButton: {
    alignSelf: 'flex-start',
  },
  attendanceActions: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  attendanceQuestion: {
    ...theme.typography.body,
    fontWeight: '500',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: theme.spacing.sm,
  },
  presentButton: {
    backgroundColor: theme.colors.success,
  },
  absentButton: {
    borderColor: theme.colors.error,
  },
  modalContent: {
    backgroundColor: 'white',
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.roundness,
    maxHeight: '80%',
  },
  modalTitle: {
    ...theme.typography.h2,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  classInfo: {
    ...theme.typography.body,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  classTime: {
    ...theme.typography.caption,
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  sectionLabel: {
    ...theme.typography.body,
    fontWeight: '500',
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  radioGroup: {
    marginBottom: theme.spacing.md,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  radioLabel: {
    ...theme.typography.body,
    marginLeft: theme.spacing.sm,
  },
  reasonChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.md,
  },
  reasonChip: {
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: theme.spacing.sm,
  },
});


