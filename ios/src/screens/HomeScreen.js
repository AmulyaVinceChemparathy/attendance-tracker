import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { theme } from '../styles/theme';

export default function HomeScreen({ navigation }) {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api('/attendance/stats');
      setStats(response.stats || []);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 75) return theme.colors.success;
    if (percentage >= 50) return theme.colors.warning;
    return theme.colors.error;
  };

  const getStatusMessage = (percentage) => {
    if (percentage >= 75) return 'Safe';
    if (percentage >= 50) return 'Warning';
    return 'Critical';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading attendance data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Welcome, {user?.name || 'Student'}!</Text>
        <Text style={styles.subtitle}>Track your attendance progress</Text>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Attendance Overview</Text>
        
        {stats.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Text style={styles.emptyText}>No attendance data available</Text>
              <Text style={styles.emptySubtext}>
                Start by adding classes to your timetable
              </Text>
            </Card.Content>
          </Card>
        ) : (
          stats.map((stat) => {
            const percentage = stat.attendanceRate ? Math.round(stat.attendanceRate * 100) : 0;
            const statusColor = getStatusColor(percentage);
            const statusMessage = getStatusMessage(percentage);

            return (
              <Card key={stat.class_id} style={styles.statCard}>
                <Card.Content>
                  <View style={styles.statHeader}>
                    <Text style={styles.subjectName}>{stat.subject}</Text>
                    <Text style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                      {statusMessage}
                    </Text>
                  </View>
                  
                  <Text style={styles.attendanceText}>
                    Present: {stat.present || 0} / Total: {stat.total || 0}
                  </Text>
                  
                  <Text style={[styles.percentageText, { color: statusColor }]}>
                    {percentage}% attendance
                  </Text>
                  
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(100, percentage)}%`,
                            backgroundColor: statusColor,
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.targetLine}>
                      <View style={styles.targetMarker} />
                      <Text style={styles.targetText}>75%</Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            );
          })
        )}
      </View>

      <View style={styles.actionsContainer}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Timetable')}
          style={styles.actionButton}
          icon="schedule"
        >
          View Timetable
        </Button>
        
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('Daily')}
          style={styles.actionButton}
          icon="today"
        >
          Today's Classes
        </Button>
        
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('Attendances')}
          style={styles.actionButton}
          icon="assignment"
        >
          View All Records
        </Button>
      </View>

      <View style={styles.logoutContainer}>
        <Button
          mode="text"
          onPress={logout}
          textColor={theme.colors.error}
          icon="logout"
        >
          Logout
        </Button>
      </View>
    </ScrollView>
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
  statsContainer: {
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
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    ...theme.typography.caption,
    textAlign: 'center',
  },
  statCard: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  subjectName: {
    ...theme.typography.h3,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.roundness / 2,
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  attendanceText: {
    ...theme.typography.caption,
    marginBottom: theme.spacing.xs,
  },
  percentageText: {
    ...theme.typography.body,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  progressContainer: {
    position: 'relative',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  targetLine: {
    position: 'absolute',
    top: -2,
    left: '75%',
    alignItems: 'center',
  },
  targetMarker: {
    width: 2,
    height: 12,
    backgroundColor: theme.colors.error,
    borderRadius: 1,
  },
  targetText: {
    fontSize: 10,
    color: theme.colors.error,
    fontWeight: 'bold',
    marginTop: 2,
  },
  actionsContainer: {
    padding: theme.spacing.lg,
    paddingTop: 0,
  },
  actionButton: {
    marginBottom: theme.spacing.md,
  },
  logoutContainer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
});

