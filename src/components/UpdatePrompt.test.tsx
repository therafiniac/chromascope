import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import UpdatePrompt from './UpdatePrompt';

describe('UpdatePrompt', () => {
  it('renders an empty status region and no button when no update is waiting', () => {
    render(<UpdatePrompt />);

    expect(screen.getByRole('status').childElementCount).toBe(0);
    expect(screen.queryByRole('button', { name: 'Update' })).toBeNull();
  });
});
