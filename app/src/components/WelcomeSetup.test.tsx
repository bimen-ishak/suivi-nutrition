import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { getGoals } from '../bulk/store';
import { getObjective } from '../utils/objective';
import { hasCompletedWelcome, saveNutritionMode } from '../utils/nutritionMode';
import { WelcomeSetup } from './WelcomeSetup';

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.lang = 'fr';
  document.documentElement.dir = 'ltr';
});

it('lets a new user choose English and enter bulking goals', () => {
  const complete = vi.fn(saveNutritionMode);
  expect(hasCompletedWelcome()).toBe(false);
  render(<WelcomeSetup initialMode="cut" onComplete={complete} />);
  fireEvent.click(screen.getByRole('button', { name: 'English' }));
  expect(document.documentElement.lang).toBe('en');
  fireEvent.click(screen.getByRole('button', { name: 'Bulking' }));
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  fireEvent.change(screen.getByLabelText('Calories per day'), { target: { value: '3100' } });
  fireEvent.change(screen.getByLabelText('Protein per day (g)'), { target: { value: '155' } });
  fireEvent.click(screen.getByRole('button', { name: 'Open my journal' }));
  expect(complete).toHaveBeenCalledWith('bulk');
  expect(getGoals()).toMatchObject({ kcal: 3100, protein: 155 });
  expect(hasCompletedWelcome()).toBe(true);
});

it('accepts a manual cutting goal without collecting a body profile', () => {
  const complete = vi.fn();
  render(<WelcomeSetup initialMode="cut" onComplete={complete} />);
  fireEvent.click(screen.getByRole('button', { name: 'Continuer' }));
  fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '-350' } });
  fireEvent.click(screen.getByRole('button', { name: 'Ouvrir mon journal' }));
  expect(complete).toHaveBeenCalledWith('cut');
  expect(getObjective()).toBe(-350);
  expect(localStorage.getItem('cutProfile')).toBeNull();
});

it('skips the welcome screen for a returning user with saved preferences', () => {
  localStorage.setItem('nutritionMode', 'bulk');
  expect(hasCompletedWelcome()).toBe(true);
});
