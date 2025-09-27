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
  SegmentedButtons,
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

export default function AttendancesScreen() {
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('months'); // 'months', 'subjects', 'details'
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    attended: true,
    reasonCategory: 'health',
    reasonText: '',
    applyToAllSubject: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [attendanceResponse, statsResponse] = await Promise.all([
        api('/attendance'),
        api('/attendance/stats')
      ]);
      setAttendance(attendanceResponse.attendance || []);
      setStats(statsResponse.stats || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getMonthsFromAttendance = () => {
    const months = new Map();
    attendance.forEach(record => {
      const date = new Date(record.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      
      if (!months.has(monthKey)) {
        months.set(monthKey, {
          key: monthKey,
          name: monthName,
          records: []
        });
      }
      months.get(monthKey).records.push(record);
    });
    return Array.from(months.values()).sort((a, b) => b.key.localeCompare(a.key));
  };

  const getSubjectsFromMonth = (monthRecords) => {
    const subjects = new Map();
    monthRecords.forEach(record => {
      if (!subjects.has(record.subject)) {
        subjects.set(record.subject, {
          subject: record.subject,
          teacher: record.teacher,
          records: []
        });
      }
      subjects.get(record.subject).records.push(record);
    });
    return Array.from(subjects.values());
  };

  const getSubjectStats = (subjectRecords) => {
    const total = subjectRecords.length;
    const present = subjectRecords.filter(r => r.attended).length;
    const percentage = total > 0 ? (present / total) * 100 : 0;
    return { total, present, percentage };
  };

  const handleMonthClick = (month) => {
    setSelectedMonth(month);
    setViewMode('subjects');
  };

  const handleSubjectClick = (subject) => {
    setSelectedSubject(subject);
    setViewMode('details');
  };

  const handleBackToMonths = () => {
    setSelectedMonth(null);
    setSelectedSubject(null);
    setViewMode('months');
  };

  const handleBackToSubjects = () => {
    setSelectedSubject(null);
    setViewMode('subjects');
  };

  const startEdit = (record) => {
    setEditingRecord(record);
    setEditForm({
      attended: record.attended,
      reasonCategory: record.reason_category || 'health',
      reasonText: record.reason_text || '',
      applyToAllSubject: false,
    });
    setShowEditModal(true);
  };

  const updateAttendance = async () => {
    try {
      if (editForm.applyToAllSubject) {
        await api('/attendance/bulk-update', {
          method: 'PUT',
          body: {
            subject: editingRecord.subject,
            attended: editForm.attended,
            reasonCategory: editForm.reasonCategory,
            reasonText: editForm.reasonText,
          }
        });
      } else {
        await api('/attendance', {
          method: 'PUT',
          body: {
            id: editingRecord.id,
            attended: editForm.attended,
            reasonCategory: editForm.reasonCategory,
            reasonText: editForm.reasonText,
          }
        });
      }
      
      await loadData();
      setShowEditModal(false);
      setEditingRecord(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update attendance');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (attended) => {
    return attended ? theme.colors.success : theme.colors.error;
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading attendance records...</Text>
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
          <View style={styles.headerContent}>
            <Text style={styles.title}>Attendance Records</Text>
            {viewMode !== 'months' && (
              <Button
                mode="outlined"
                onPress={viewMode === 'subjects' ? handleBackToMonths : handleBackToSubjects}
                compact
                icon="arrow-back"
              >
                Back
              </Button>
            )}
          </View>
        </View>

        {viewMode === 'months' && (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Monthly Attendance Overview</Text>
            {getMonthsFromAttendance().length === 0 ? (
              <Card style={styles.emptyCard}>
                <Card.Content style={styles.emptyContent}>
                  <Text style={styles.emptyText}>No attendance records found</Text>
                </Card.Content>
              </Card>
            ) : (
              <View style={styles.monthsContainer}>
                {getMonthsFromAttendance().map(month => (
                  <Card
                    key={month.key}
                    style={styles.monthCard}
                    onPress={() => handleMonthClick(month)}
                  >
                    <Card.Content>
                      <Text style={styles.monthName}>{month.name}</Text>
                      <Text style={styles.monthRecords}>
                        {month.records.length} attendance records
                      </Text>
                    </Card.Content>
                  </Card>
                ))}
              </View>
            )}
          </View>
        )}

        {viewMode === 'subjects' && selectedMonth && (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Subjects for {selectedMonth.name}</Text>
            {getSubjectsFromMonth(selectedMonth.records).length === 0 ? (
              <Card style={styles.emptyCard}>
                <Card.Content style={styles.emptyContent}>
                  <Text style={styles.emptyText}>No subjects found for this month</Text>
                </Card.Content>
              </Card>
            ) : (
              <View style={styles.subjectsContainer}>
                {getSubjectsFromMonth(selectedMonth.records).map(subject => {
                  const stats = getSubjectStats(subject.records);
                  const isSafe = stats.percentage >= 75;
                  return (
                    <Card
                      key={subject.subject}
                      style={[
                        styles.subjectCard,
                        { borderColor: isSafe ? theme.colors.success : theme.colors.error }
                      ]}
                      onPress={() => handleSubjectClick(subject)}
                    >
                      <Card.Content>
                        <Text style={styles.subjectName}>{subject.subject}</Text>
                        <Text style={styles.subjectTeacher}>{subject.teacher}</Text>
                        <Text style={styles.subjectStats}>
                          Present: {stats.present} / Total: {stats.total}
                        </Text>
                        <Text style={[
                          styles.subjectPercentage,
                          { color: isSafe ? theme.colors.success : theme.colors.error }
                        ]}>
                          {Math.round(stats.percentage)}% attendance
                        </Text>
                      </Card.Content>
                    </Card>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {viewMode === 'details' && selectedSubject && (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>
              {selectedSubject.subject} - {selectedMonth.name}
            </Text>
            <View style={styles.recordsContainer}>
              {selectedSubject.records.map(record => (
                <Card key={record.id} style={styles.recordCard}>
                  <Card.Content>
                    <View style={styles.recordHeader}>
                      <Text style={styles.recordSubject}>{record.subject}</Text>
                      <Chip
                        style={[
                          styles.statusChip,
                          { backgroundColor: getStatusColor(record.attended) }
                        ]}
                        textStyle={styles.statusChipText}
                      >
                        {record.attended ? 'Present' : 'Absent'}
                      </Chip>
                    </View>
                    
                    <Text style={styles.recordTeacher}>{record.teacher}</Text>
                    <Text style={styles.recordDate}>
                      {formatDate(record.date)} • {record.start_time}-{record.end_time}
                    </Text>
                    
                    {!record.attended && record.reason_category && (
                      <View style={styles.reasonContainer}>
                        <Text style={styles.reasonLabel}>Reason:</Text>
                        <Chip style={styles.reasonChip}>
                          {getReasonText(record.reason_category)}
                        </Chip>
                      </View>
                    )}
                    
                    {!record.attended && record.reason_text && (
                      <Text style={styles.reasonText}>
                        "{record.reason_text}"
                      </Text>
                    )}
                    
                    <Button
                      mode="outlined"
                      onPress={() => startEdit(record)}
                      style={styles.editButton}
                    >
                      Edit
                    </Button>
                  </Card.Content>
                </Card>
              ))}
            </View>
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
              {editingRecord?.subject} • {editingRecord?.teacher}
            </Text>
            <Text style={styles.classTime}>
              {formatDate(editingRecord?.date)} • {editingRecord?.start_time}-{editingRecord?.end_time}
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

            <View style={styles.bulkUpdateContainer}>
              <View style={styles.bulkUpdateRow}>
                <RadioButton
                  value="single"
                  status={!editForm.applyToAllSubject ? 'checked' : 'unchecked'}
                  onPress={() => setEditForm({ ...editForm, applyToAllSubject: false })}
                />
                <Text style={styles.radioLabel}>Update this record only</Text>
              </View>
              <View style={styles.bulkUpdateRow}>
                <RadioButton
                  value="all"
                  status={editForm.applyToAllSubject ? 'checked' : 'unchecked'}
                  onPress={() => setEditForm({ ...editForm, applyToAllSubject: true })}
                />
                <Text style={styles.radioLabel}>
                  Apply to ALL {editingRecord?.subject} classes
                </Text>
              </View>
              {editForm.applyToAllSubject && (
                <Text style={styles.warningText}>
                  ⚠️ This will update all attendance records for this subject across all dates
                </Text>
              )}
            </View>

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
                onPress={updateAttendance}
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
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...theme.typography.h1,
    color: 'white',
  },
  content: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h2,
    marginBottom: theme.spacing.lg,
  },
  emptyCard: {
    marginBottom: theme.spacing.md,
  },
  emptyContent: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    ...theme.typography.h3,
    textAlign: 'center',
  },
  monthsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthCard: {
    width: '48%',
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  monthName: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.xs,
  },
  monthRecords: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  subjectCard: {
    width: '48%',
    marginBottom: theme.spacing.md,
    elevation: 2,
    borderWidth: 2,
  },
  subjectName: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.xs,
  },
  subjectTeacher: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  subjectStats: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  subjectPercentage: {
    ...theme.typography.body,
    fontWeight: 'bold',
  },
  recordsContainer: {
    flexDirection: 'column',
  },
  recordCard: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  recordSubject: {
    ...theme.typography.h3,
    flex: 1,
  },
  statusChip: {
    borderRadius: theme.roundness / 2,
  },
  statusChipText: {
    color: 'white',
    fontWeight: 'bold',
  },
  recordTeacher: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  recordDate: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
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
  bulkUpdateContainer: {
    backgroundColor: '#f8f9fa',
    padding: theme.spacing.md,
    borderRadius: theme.roundness / 2,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: theme.spacing.md,
  },
  bulkUpdateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  warningText: {
    ...theme.typography.caption,
    color: theme.colors.warning,
    marginTop: theme.spacing.sm,
    marginLeft: theme.spacing.lg,
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


