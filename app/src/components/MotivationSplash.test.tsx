import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MotivationSplash } from './MotivationSplash';

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.setItem('cutGoalDate', '2026-12-15');
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  localStorage.clear();
});

const splash = () => screen.getByRole('dialog');

it('s’arrête tant que le doigt reste posé, puis reprend', () => {
  const done = vi.fn();
  render(<MotivationSplash today="2026-11-17" onDone={done} />);
  act(() => { vi.advanceTimersByTime(1000); });
  fireEvent.pointerDown(splash());
  act(() => { vi.advanceTimersByTime(20000); });
  expect(done).not.toHaveBeenCalled();
  expect(splash().getAttribute('data-paused')).toBe('true');
  fireEvent.pointerUp(splash());
  expect(splash().getAttribute('data-paused')).toBeNull();
  act(() => { vi.advanceTimersByTime(9000); });
  expect(done).toHaveBeenCalledTimes(1);
});

it('un simple appui passe l’écran', () => {
  const done = vi.fn();
  render(<MotivationSplash today="2026-11-17" onDone={done} />);
  fireEvent.pointerDown(splash());
  act(() => { vi.advanceTimersByTime(100); });
  fireEvent.pointerUp(splash());
  act(() => { vi.advanceTimersByTime(900); });
  expect(done).toHaveBeenCalledTimes(1);
});

it('s’ouvre tout seul à la fin sans appui', () => {
  const done = vi.fn();
  render(<MotivationSplash today="2026-11-17" onDone={done} />);
  act(() => { vi.advanceTimersByTime(9000); });
  expect(done).toHaveBeenCalledTimes(1);
});
