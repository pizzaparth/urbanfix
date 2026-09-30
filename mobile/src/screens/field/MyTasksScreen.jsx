import React from 'react';
import TaskList from '../../components/TaskList.jsx';

const MyTasksScreen = ({ navigation }) => (
  <TaskList
    navigation={navigation}
    state="active"
    title="My tasks"
    sub={(n) => (n === 1 ? '1 task on your plate.' : `${n} tasks on your plate.`)}
    empty="Nothing assigned to you right now."
    showStats
  />
);

export default MyTasksScreen;
