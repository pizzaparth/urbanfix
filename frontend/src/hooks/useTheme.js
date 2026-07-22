import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext.jsx';

export const useTheme = () => {
  return useContext(ThemeContext);
};
