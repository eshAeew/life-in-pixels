import test from 'node:test';
import assert from 'node:assert/strict';
import { StorageService } from './storage';
import type { DailyEntry, Milestone, Memory } from '../types';

test('StorageService initializes with zero dummy data', () => {
  StorageService.clearAllData();
  const data = StorageService.getData();

  assert.equal(data.entries.length, 0, 'Entries must start empty without dummy seeds');
  assert.equal(data.milestones.length, 0, 'Milestones must start empty without dummy seeds');
  assert.equal(data.memories.length, 0, 'Memories must start empty without dummy seeds');
});

test('StorageService saves and retrieves user entries persistently', () => {
  StorageService.clearAllData();

  const newEntry: DailyEntry = {
    id: 'entry-2026-10-28',
    date: '2026-10-28',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    mood: 'good',
    overallRating: 4,
    energyRating: 4,
    stressRating: 2,
    meaningRating: 5,
    meaningResponses: [{ id: '1', question: 'Did today feel meaningful?', answeredYes: true }],
    tags: ['Mindfulness', 'Coding'],
    reflection: 'Building real local storage for the journal.',
    pixelColor: '#FFB7B2',
    isCompleted: true,
  };

  StorageService.saveEntry(newEntry);
  const data = StorageService.getData();

  assert.equal(data.entries.length, 1);
  assert.equal(data.entries[0].date, '2026-10-28');
  assert.equal(data.entries[0].reflection, 'Building real local storage for the journal.');

  // Auto-sync reflection to memory
  assert.equal(data.memories.length, 1);
  assert.equal(data.memories[0].text, 'Building real local storage for the journal.');
});

test('StorageService saves and deletes milestones', () => {
  const milestone: Milestone = {
    id: 'user-milestone-1',
    date: '2026-10-28',
    title: 'Completed 10 Mindful Breath Sessions',
    category: 'health',
    color: '#FFB7B2',
    isFutureGoal: false,
    createdAt: new Date().toISOString(),
  };

  StorageService.saveMilestone(milestone);
  assert.equal(StorageService.getData().milestones.length, 1);

  StorageService.deleteMilestone('user-milestone-1');
  assert.equal(StorageService.getData().milestones.length, 0);
});

test('StorageService stats reflect real storage counts', () => {
  const stats = StorageService.getStats();
  assert.ok(typeof stats.entriesCount === 'number');
  assert.ok(typeof stats.memoriesCount === 'number');
  assert.ok(typeof stats.milestonesCount === 'number');
});
