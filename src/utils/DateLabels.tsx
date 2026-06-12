import moment from 'moment';

export const DateLabels = (date: any) => {
  const now = moment();
  const inputDate = moment(date);

  if (!inputDate.isValid()) return 'Invalid date';

  const diffInMinutes = now.diff(inputDate, 'minutes');
  const diffInHours = now.diff(inputDate, 'hours');
  const diffInDays = now.diff(inputDate, 'days');

  if (diffInMinutes < 1) return 'Just now';
  // if (inputDate.isSame(now, 'day')) return 'Today';
  if (diffInMinutes < 60) return `${diffInMinutes} min${diffInMinutes === 1 ? '' : 's'} ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  if (diffInDays < 14) return 'Last week';
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} week${Math.floor(diffInDays / 7) === 1 ? '' : 's'} ago`;
  if (diffInDays < 60) return 'Last month';

  return inputDate.format('Do MMM, YYYY'); // e.g., 6th Jun, 2025
};
