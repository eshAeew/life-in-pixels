import { useState, useEffect } from 'react';
import type { DailyEntry, Memory, Milestone, UserSettings } from '../types';
import { StorageService } from '../services/storage';

export function useLifeStore() {
  // Local state subscribed to the StorageService
  const [data, setData] = useState(() => StorageService.getData());

  useEffect(() => {
    // Subscribe to reactive store changes across all components and windows
    const unsubscribe = StorageService.subscribe(() => {
      setData({ ...StorageService.getData() });
    });
    return unsubscribe;
  }, []);

  const saveEntry = (entry: DailyEntry) => {
    StorageService.saveEntry(entry);
  };

  const deleteEntry = (dateStr: string) => {
    StorageService.deleteEntry(dateStr);
  };

  const addMilestone = (milestone: Milestone) => {
    StorageService.saveMilestone(milestone);
  };

  const updateMilestone = (milestone: Milestone) => {
    StorageService.saveMilestone(milestone);
  };

  const deleteMilestone = (id: string) => {
    StorageService.deleteMilestone(id);
  };

  const addMemory = (memory: Memory) => {
    StorageService.saveMemory(memory);
  };

  const updateMemory = (memory: Memory) => {
    StorageService.saveMemory(memory);
  };

  const deleteMemory = (id: string) => {
    StorageService.deleteMemory(id);
  };

  const toggleFavoriteMemory = (id: string) => {
    StorageService.toggleFavoriteMemory(id);
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    StorageService.updateSettings(newSettings);
  };

  const clearAllData = () => {
    StorageService.clearAllData();
  };

  const exportBackup = () => {
    StorageService.exportBackup();
  };

  const importData = (backup: any) => {
    StorageService.importBackup(backup);
  };

  const getEntryByDate = (date: string): DailyEntry | undefined => {
    return data.entries.find((e) => e.date === date);
  };

  const getMilestoneByDate = (date: string): Milestone | undefined => {
    return data.milestones.find((m) => m.date === date);
  };

  return {
    entries: data.entries,
    milestones: data.milestones,
    memories: data.memories,
    settings: data.settings,
    saveEntry,
    deleteEntry,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    addMemory,
    updateMemory,
    deleteMemory,
    toggleFavoriteMemory,
    updateSettings,
    clearAllData,
    exportBackup,
    importData,
    getEntryByDate,
    getMilestoneByDate,
    getStorageStats: StorageService.getStats,
  };
}
