import React, { createContext, useContext, useState, useEffect } from 'react';

const GlobalAppContext = createContext();

export const GlobalAppProvider = ({ children }) => {
  // Theme State
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  
  // Workspace Mode State: 'branches', 'areas', 'clinics'
  const [workspaceMode, setWorkspaceMode] = useState(() => localStorage.getItem('workspaceMode') || 'clinics');
  
  // Admin Master Unlock State
  const [isMasterUnlocked, setIsMasterUnlocked] = useState(false);

  // Month Isolation Lock State: 'branch', 'area', 'clinic', or null
  const [lockedLevel, setLockedLevel] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('workspaceMode', workspaceMode);
  }, [workspaceMode]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  return (
    <GlobalAppContext.Provider value={{ 
      theme, 
      toggleTheme, 
      workspaceMode, 
      setWorkspaceMode,
      isMasterUnlocked,
      setIsMasterUnlocked,
      lockedLevel,
      setLockedLevel
    }}>
      {children}
    </GlobalAppContext.Provider>
  );
};

export const useGlobalApp = () => {
  const context = useContext(GlobalAppContext);
  if (!context) throw new Error('useGlobalApp must be used within GlobalAppProvider');
  return context;
};
