// tests/button.test.tsx
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Navbar from '@/components/Navbar';

test('Navbar renders correctly', () => {
  render(<Navbar />);
  expect(screen.getByText('My Project')).toBeInTheDocument();
});
