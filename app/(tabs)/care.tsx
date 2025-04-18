import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Calendar, Droplet, Sun, Wind, CircleArrowRight as ArrowRightCircle, Clipboard, Check } from 'lucide-react-native';
import { useCareSchedules } from '@/data/careSchedule';

export default function CareScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('today');
  const [completedTasks, setCompletedTasks] = useState([]);
  const { careSchedule, loading, error } = useCareSchedules();

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Get day names for the next 7 days
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      full: date,
    };
  });

  // Filter tasks based on the selected date
  const getTasksForDate = (date) => {
    if (!careSchedule) return [];
    
    const dateStr = date.toISOString().split('T')[0];
    return careSchedule.filter(task => {
      const taskDate = new Date(task.scheduled_date).toISOString().split('T')[0];
      return taskDate === dateStr;
    });
  };

  const tasksForSelectedDate = getTasksForDate(selectedDate);
  
  // Filter tasks for Today, Upcoming, and All
  const todayTasks = getTasksForDate(today);
  const upcomingTasks = careSchedule?.filter(task => {
    const taskDate = new Date(task.scheduled_date);
    const todayDate = new Date(today);
    todayDate.setHours(0, 0, 0, 0);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate > todayDate;
  }) || [];
  
  const displayTasks = 
    activeTab === 'today' ? todayTasks :
    activeTab === 'upcoming' ? upcomingTasks :
    careSchedule || [];
  
  const toggleTaskComplete = (taskId) => {
    setCompletedTasks(prev => {
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId);
      } else {
        return [...prev, taskId];
      }
    });
  };
  
  // Get icon for task type
  const getTaskIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'water':
        return <Droplet size={20} color="#3A8349" />;
      case 'light':
        return <Sun size={20} color="#FFAD33" />;
      case 'mist':
        return <Wind size={20} color="#33A1FF" />;
      default:
        return <Clipboard size={20} color="#3A8349" />;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3A8349" />
          <Text style={[styles.loadingText, { color: isDark ? '#E0E0E0' : '#283618' }]}>
            Loading care schedule...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: isDark ? '#FFB4A1' : '#D27D4C' }]}>
            {error.message}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: '#3A8349' }]}
            onPress={() => router.replace('/(tabs)/care')}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Calendar color={isDark ? '#8EB69B' : '#3A8349'} size={24} />
          <Text style={[styles.title, { color: isDark ? '#E0E0E0' : '#283618' }]}>
            Plant Care
          </Text>
        </View>
      </View>
      
      {/* Date selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.dateSelector}
        contentContainerStyle={styles.dateSelectorContent}
      >
        {weekDays.map((item, index) => {
          const isSelected = 
            selectedDate.getDate() === item.full.getDate() && 
            selectedDate.getMonth() === item.full.getMonth();
          
          const isToday = index === 0;
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateItem,
                isSelected && styles.selectedDateItem,
                isSelected && { backgroundColor: '#3A8349' }
              ]}
              onPress={() => {
                setSelectedDate(item.full);
                setActiveTab('custom');
              }}
            >
              <Text style={[
                styles.dateDayText,
                { color: isSelected ? 'white' : isDark ? '#BBBBBB' : '#555555' }
              ]}>
                {isToday ? 'Today' : item.day}
              </Text>
              <Text style={[
                styles.dateNumberText,
                { color: isSelected ? 'white' : isDark ? '#E0E0E0' : '#283618' }
              ]}>
                {item.date}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      
      {/* Tab selector */}
      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'today' && styles.activeTabItem,
            activeTab === 'today' && { borderBottomColor: '#3A8349' }
          ]}
          onPress={() => {
            setActiveTab('today');
            setSelectedDate(today);
          }}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'today' && styles.activeTabText,
            { color: activeTab === 'today' ? '#3A8349' : isDark ? '#BBBBBB' : '#555555' }
          ]}>
            Today
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'upcoming' && styles.activeTabItem,
            activeTab === 'upcoming' && { borderBottomColor: '#3A8349' }
          ]}
          onPress={() => {
            setActiveTab('upcoming');
          }}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'upcoming' && styles.activeTabText,
            { color: activeTab === 'upcoming' ? '#3A8349' : isDark ? '#BBBBBB' : '#555555' }
          ]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'all' && styles.activeTabItem,
            activeTab === 'all' && { borderBottomColor: '#3A8349' }
          ]}
          onPress={() => {
            setActiveTab('all');
          }}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'all' && styles.activeTabText,
            { color: activeTab === 'all' ? '#3A8349' : isDark ? '#BBBBBB' : '#555555' }
          ]}>
            All Tasks
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Task list */}
      {displayTasks.length > 0 ? (
        <ScrollView
          style={styles.taskListContainer}
          contentContainerStyle={styles.taskList}
          showsVerticalScrollIndicator={false}
        >
          {displayTasks.map((task, index) => {
            const isCompleted = completedTasks.includes(task.id);
            const taskDate = new Date(task.scheduled_date);
            const isToday = 
              taskDate.getDate() === today.getDate() && 
              taskDate.getMonth() === today.getMonth();
              
            return (
              <View key={task.id}>
                {!isToday && activeTab !== 'today' && (
                  <Text style={[styles.dateHeader, { color: isDark ? '#BBBBBB' : '#555555' }]}>
                    {taskDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </Text>
                )}
                
                <TouchableOpacity
                  style={[
                    styles.taskCard,
                    { backgroundColor: isDark ? '#2A3A30' : '#FFFFFF' },
                    isCompleted && { opacity: 0.7 }
                  ]}
                  onPress={() => router.push({
                    pathname: '/taskDetail',
                    params: { 
                      id: task.id, 
                      plantName: task.plantName,
                      action: task.action
                    }
                  })}
                >
                  <TouchableOpacity
                    style={[
                      styles.checkboxContainer,
                      isCompleted && { backgroundColor: '#3A8349', borderColor: '#3A8349' }
                    ]}
                    onPress={() => toggleTaskComplete(task.id)}
                  >
                    {isCompleted && <Check size={16} color="white" />}
                  </TouchableOpacity>
                  
                  <View style={styles.taskIconContainer}>
                    {getTaskIcon(task.action)}
                  </View>
                  
                  <View style={styles.taskContent}>
                    <Text style={[
                      styles.taskTitle,
                      { color: isDark ? '#E0E0E0' : '#283618' },
                      isCompleted && styles.completedTaskText
                    ]}>
                      {task.action} {task.plantName}
                    </Text>
                    
                    <Text style={[
                      styles.taskTime,
                      { color: isDark ? '#BBBBBB' : '#555555' }
                    ]}>
                      {task.scheduled_time || 'Anytime today'}
                    </Text>
                  </View>
                  
                  <ArrowRightCircle 
                    size={22} 
                    color={isDark ? '#8EB69B' : '#3A8349'} 
                    style={styles.taskArrow} 
                  />
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <View style={[
            styles.emptyIconContainer,
            { backgroundColor: isDark ? '#2A3A30' : '#E6F2E8' }
          ]}>
            <Calendar size={40} color="#3A8349" />
          </View>
          <Text style={[styles.emptyTitle, { color: isDark ? '#E0E0E0' : '#283618' }]}>
            All Caught Up!
          </Text>
          <Text style={[styles.emptyText, { color: isDark ? '#BBBBBB' : '#555555' }]}>
            You have no plant care tasks for {
              activeTab === 'today' ? 'today' : 
              activeTab === 'upcoming' ? 'the upcoming days' : 
              'this period'
            }
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginLeft: 8,
  },
  dateSelector: {
    maxHeight: 80,
  },
  dateSelectorContent: {
    paddingHorizontal: 20,
  },
  dateItem: {
    width: 70,
    height: 70,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  selectedDateItem: {
    backgroundColor: '#3A8349',
  },
  dateDayText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dateNumberText: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  tabSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  tabItem: {
    paddingBottom: 8,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabItem: {
    borderBottomWidth: 2,
    borderBottomColor: '#3A8349',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: '600',
  },
  taskListContainer: {
    flex: 1,
  },
  taskList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 20,
    marginBottom: 8,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3A8349',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(58, 131, 73, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
  },
  taskTime: {
    fontSize: 14,
    marginTop: 2,
  },
  taskArrow: {
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});