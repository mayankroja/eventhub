import { render, screen } from '@testing-library/react';
import EventCard from '@/app/components/event-card';



describe('EventCard', () => {
  const props = {
    id: '1',
    title: 'Test Event',
    date: '2025-12-01T10:00:00Z',
    location: 'Test Location',
    capacity: 100,
    registeredCount: 30,
  };

  it('renders event details correctly', () => {
    render(<EventCard {...props} />);

    expect(screen.getByText('Test Event')).toBeInTheDocument();
    expect(screen.getByText(/Test Location/)).toBeInTheDocument();
    expect(screen.getByText(/70 \/ 100 seats available/)).toBeInTheDocument(); // 100-30=70
    expect(screen.getByRole('link', { name: /view details/i })).toHaveAttribute('href', '/events/1');
  });

  it('shows available seats as 0 when capacity equals registeredCount', () => {
    render(<EventCard {...props} registeredCount={100} />);
    expect(screen.getByText(/0 \/ 100 seats available/)).toBeInTheDocument();
  });
});