import { render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import { CalorieRing } from './CalorieRing';

it('distinguishes remaining calories, the exact limit, and increasingly high overruns', () => {
  const { rerender } = render(<CalorieRing eaten={1500} budget={2000} />);
  const status = screen.getByRole('status');
  const ring = status.parentElement!;
  expect(within(status).getByText('500')).toBeTruthy();
  expect(within(status).getByText('kcal restantes')).toBeTruthy();
  expect(ring.style.getPropertyValue('--budget-use')).toBe('75%');
  expect(ring.classList.contains('over')).toBe(false);

  rerender(<CalorieRing eaten={2000} budget={2000} />);
  expect(within(status).getByText('Limite du jour atteinte')).toBeTruthy();
  expect(ring.classList.contains('over')).toBe(false);

  rerender(<CalorieRing eaten={2250} budget={2000} provisional />);
  expect(within(status).getByText('250')).toBeTruthy();
  expect(within(status).getByText('kcal au-dessus de la limite')).toBeTruthy();
  expect(within(status).getByText('Estimation')).toBeTruthy();
  expect(ring.classList.contains('over')).toBe(true);
  expect(ring.style.getPropertyValue('--budget-over')).toBe('25%');

  rerender(<CalorieRing eaten={3500} budget={2000} />);
  expect(ring.style.getPropertyValue('--budget-over')).toBe('100%');
});
