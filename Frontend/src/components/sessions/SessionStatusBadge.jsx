'use client';

const SessionStatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending',
          className: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
        };
      case 'accepted':
        return {
          label: 'Accepted',
          className: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
        };
      case 'completed':
        return {
          label: 'Completed',
          className: 'bg-green-500/20 text-green-500 border-green-500/30',
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          className: 'bg-red-500/20 text-red-500 border-red-500/30',
        };
      default:
        return {
          label: status || 'Unknown',
          className: 'bg-gray-500/20 text-gray-500 border-gray-500/30',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
    >
      {config.label}
    </span>
  );
};

export default SessionStatusBadge;

