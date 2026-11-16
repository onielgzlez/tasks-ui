import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders children text correctly', () => {
    render(<Badge variant="success">Completada</Badge>);
    expect(screen.getByText('Completada')).toBeInTheDocument();
  });
});
