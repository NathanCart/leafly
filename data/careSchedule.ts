// Mock data for care schedule
export const careSchedule = [
  {
    id: '1',
    plantName: 'Monstera Deliciosa',
    plantId: '1',
    action: 'Water',
    date: new Date().toISOString(),
    time: '09:00 AM',
    isCompleted: false,
    notes: 'Water thoroughly until water drains from bottom of pot',
  },
  {
    id: '2',
    plantName: 'Snake Plant',
    plantId: '2',
    action: 'Water',
    date: new Date().toISOString(),
    time: '10:00 AM',
    isCompleted: false,
    notes: 'Only water when soil is completely dry',
  },
  {
    id: '3',
    plantName: 'Fiddle Leaf Fig',
    plantId: '3',
    action: 'Mist',
    date: (() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString();
    })(),
    time: '09:00 AM',
    isCompleted: false,
    notes: 'Mist leaves to increase humidity',
  },
  {
    id: '4',
    plantName: 'Pothos',
    plantId: '4',
    action: 'Water',
    date: (() => {
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);
      return dayAfter.toISOString();
    })(),
    time: '09:00 AM',
    isCompleted: false,
    notes: 'Check soil moisture first, only water if dry',
  },
  {
    id: '5',
    plantName: 'Peace Lily',
    plantId: '5',
    action: 'Fertilize',
    date: (() => {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek.toISOString();
    })(),
    time: '09:00 AM',
    isCompleted: false,
    notes: 'Use diluted liquid fertilizer',
  },
  {
    id: '6',
    plantName: 'Monstera Deliciosa',
    plantId: '1',
    action: 'Rotate',
    date: (() => {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 5);
      return nextWeek.toISOString();
    })(),
    time: '09:00 AM',
    isCompleted: false,
    notes: 'Rotate pot to ensure even growth',
  },
];