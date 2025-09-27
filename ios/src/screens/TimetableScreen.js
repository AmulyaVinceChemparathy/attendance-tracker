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
  FAB,
  Portal,
  Modal,
  TextInput,
  Chip,
} from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import { api } from '../lib/api';
import { theme } from '../styles/theme';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function TimetableScreen() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [form, setForm] = useState({
    dayOfWeek: 0,
    startTime: '08:00',
    endTime: '09:00',
    subject: '',
    teacher: '',
    location: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const response = await api('/schedule');
      setClasses(response.classes || []);
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClasses();
    setRefreshing(false);
  };

  const saveClass = async () => {
    if (!form.subject || !form.teacher) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      if (editingClass) {
        await api(`/schedule/${editingClass.id}`, {
          method: 'PUT',
          body: form,
        });
      } else {
        await api('/schedule', {
          method: 'POST',
          body: form,
        });
      }
      
      await loadClasses();
      setShowForm(false);
      setEditingClass(null);
      setForm({
        dayOfWeek: 0,
        startTime: '08:00',
        endTime: '09:00',
        subject: '',
        teacher: '',
        location: '',
      });
      setError('');
    } catch (error) {
      setError(error.message);
    }
  };

  const deleteClass = async (id) => {
    Alert.alert(
      'Delete Class',
      'Are you sure you want to delete this class?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api(`/schedule/${id}`, { method: 'DELETE' });
              await loadClasses();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete class');
            }
          },
        },
      ]
    );
  };

  const startEdit = (classData) => {
    setEditingClass(classData);
    setForm({
      dayOfWeek: classData.dayOfWeek ?? classData.day_of_week,
      startTime: classData.startTime ?? classData.start_time,
      endTime: classData.endTime ?? classData.end_time,
      subject: classData.subject,
      teacher: classData.teacher,
      location: classData.location || '',
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingClass(null);
    setShowForm(false);
    setForm({
      dayOfWeek: 0,
      startTime: '08:00',
      endTime: '09:00',
      subject: '',
      teacher: '',
      location: '',
    });
    setError('');
  };

  const getClassesForDay = (dayIndex) => {
    return classes.filter(cls => cls.dayOfWeek === dayIndex);
  };

  const formatTime = (time) => {
    return time.replace(':', '');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading timetable...</Text>
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
          <Text style={styles.title}>Timetable</Text>
          <Text style={styles.subtitle}>
            {editingClass ? 'Edit Class' : 'Manage your class schedule'}
          </Text>
        </View>

        {classes.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Text style={styles.emptyText}>No classes scheduled</Text>
              <Text style={styles.emptySubtext}>
                Add your first class to get started
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.timetableContainer}>
            {DAYS.map((day, dayIndex) => {
              const dayClasses = getClassesForDay(dayIndex);
              return (
                <Card key={day} style={styles.dayCard}>
                  <Card.Content>
                    <Text style={styles.dayTitle}>{day}</Text>
                    {dayClasses.length === 0 ? (
                      <Text style={styles.noClassesText}>No classes</Text>
                    ) : (
                      dayClasses.map((cls) => (
                        <View key={cls.id} style={styles.classItem}>
                          <View style={styles.classInfo}>
                            <Text style={styles.classSubject}>{cls.subject}</Text>
                            <Text style={styles.classTeacher}>{cls.teacher}</Text>
                            <Text style={styles.classTime}>
                              {cls.startTime} - {cls.endTime}
                            </Text>
                            {cls.location && (
                              <Text style={styles.classLocation}>{cls.location}</Text>
                            )}
                          </View>
                          <View style={styles.classActions}>
                            <Button
                              mode="text"
                              onPress={() => startEdit(cls)}
                              compact
                            >
                              Edit
                            </Button>
                            <Button
                              mode="text"
                              onPress={() => deleteClass(cls.id)}
                              textColor={theme.colors.error}
                              compact
                            >
                              Delete
                            </Button>
                          </View>
                        </View>
                      ))
                    )}
                  </Card.Content>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setShowForm(true)}
      />

      <Portal>
        <Modal
          visible={showForm}
          onDismiss={cancelEdit}
          contentContainerStyle={styles.modalContent}
        >
          <ScrollView>
            <Text style={styles.modalTitle}>
              {editingClass ? 'Edit Class' : 'Add New Class'}
            </Text>

            <TextInput
              label="Subject *"
              value={form.subject}
              onChangeText={(text) => setForm({ ...form, subject: text })}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Teacher *"
              value={form.teacher}
              onChangeText={(text) => setForm({ ...form, teacher: text })}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Location"
              value={form.location}
              onChangeText={(text) => setForm({ ...form, location: text })}
              mode="outlined"
              style={styles.input}
            />

            <View style={styles.timeRow}>
              <TextInput
                label="Start Time"
                value={form.startTime}
                onChangeText={(text) => setForm({ ...form, startTime: text })}
                mode="outlined"
                style={[styles.input, styles.timeInput]}
              />
              <TextInput
                label="End Time"
                value={form.endTime}
                onChangeText={(text) => setForm({ ...form, endTime: text })}
                mode="outlined"
                style={[styles.input, styles.timeInput]}
              />
            </View>

            <Text style={styles.dayLabel}>Day of Week</Text>
            <View style={styles.dayChips}>
              {DAYS.map((day, index) => (
                <Chip
                  key={day}
                  selected={form.dayOfWeek === index}
                  onPress={() => setForm({ ...form, dayOfWeek: index })}
                  style={styles.dayChip}
                >
                  {day}
                </Chip>
              ))}
            </View>

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            <View style={styles.modalActions}>
              <Button mode="outlined" onPress={cancelEdit} style={styles.modalButton}>
                Cancel
              </Button>
              <Button mode="contained" onPress={saveClass} style={styles.modalButton}>
                {editingClass ? 'Update' : 'Add'} Class
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
  timetableContainer: {
    padding: theme.spacing.lg,
  },
  dayCard: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  dayTitle: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.sm,
    color: theme.colors.primary,
  },
  noClassesText: {
    ...theme.typography.caption,
    fontStyle: 'italic',
    color: theme.colors.textSecondary,
  },
  classItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  classInfo: {
    flex: 1,
  },
  classSubject: {
    ...theme.typography.body,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  classTeacher: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  classTime: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  classLocation: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  classActions: {
    flexDirection: 'row',
  },
  fab: {
    position: 'absolute',
    margin: theme.spacing.lg,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
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
  input: {
    marginBottom: theme.spacing.md,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeInput: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  dayLabel: {
    ...theme.typography.body,
    fontWeight: '500',
    marginBottom: theme.spacing.sm,
  },
  dayChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.lg,
  },
  dayChip: {
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: theme.spacing.sm,
  },
});

