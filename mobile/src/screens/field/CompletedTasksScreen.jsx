import React from 'react';
import TaskList from '../../components/TaskList.jsx';

const CompletedTasksScreen = ({ navigation }) => (
  <TaskList
    navigation={navigation}
    state="completed"
    title="Completed"
    sub={(n) => `${n} closed by your supervisor.`}
    empty="Nothing closed yet."
  />
);

export default CompletedTasksScreen;
