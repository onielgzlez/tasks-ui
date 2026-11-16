import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('renders initials and full name when showName is true', () => {
    render(<Avatar name="Elena Gómez" showName />);
    expect(screen.getByText('EG')).toBeInTheDocument();
    expect(screen.getByText('Elena Gómez')).toBeInTheDocument();
  });
});
