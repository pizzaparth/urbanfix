import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { MOCK_COMPLAINTS } from '../data/mock';

const AppContext = createContext(null);

// All app state lives here. Purely local — no API layer, no persistence.
export function AppProvider({ children }) {
  const [user, setUser] = useState(null); // { name, email, role: 'citizen' | 'admin' }
  const [complaints, setComplaints] = useState(() => MOCK_COMPLAINTS.map((c) => ({ ...c })));

  const signInCitizen = useCallback((name, email) => {
    setUser({ name: name || 'Alex Rivera', email, role: 'citizen' });
  }, []);

  const signInAdmin = useCallback(() => {
    setUser({ name: 'Jordan Blake', email: 'jordan.blake@urbanfix.gov', role: 'admin' });
  }, []);

  const signOut = useCallback(() => setUser(null), []);

  const addComplaint = useCallback((complaint) => {
    setComplaints((prev) => [{ ...complaint, mine: true }, ...prev]);
  }, []);

  const setStatus = useCallback((id, status) => {
    setComplaints((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  }, []);

  const findByTrackingId = useCallback(
    (tid) => complaints.find((c) => c.trackingId.toUpperCase() === String(tid).trim().toUpperCase()) || null,
    [complaints]
  );

  const value = useMemo(
    () => ({ user, complaints, signInCitizen, signInAdmin, signOut, addComplaint, setStatus, findByTrackingId }),
    [user, complaints, signInCitizen, signInAdmin, signOut, addComplaint, setStatus, findByTrackingId]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
