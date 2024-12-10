// attendance.js

import AsyncStorage from '@react-native-async-storage/async-storage';

export const markAttendance = async (status) => {
  try {
    const currentDate = new Date().toISOString().split('T')[0];
    let attendance = await AsyncStorage.getItem('attendance');
    attendance = attendance ? JSON.parse(attendance) : {};

    attendance[currentDate] = status;

    await AsyncStorage.setItem('attendance', JSON.stringify(attendance));
    console.log('Attendance marked successfully');
  } catch (error) {
    console.error('Error marking attendance', error);
  }
};
