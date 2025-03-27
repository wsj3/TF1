import React from 'react';
import { getAppointmentTypeById } from '../utils/appointmentUtils';

/**
 * Component for displaying appointment type as a badge
 * 
 * @param {Object} props - Component props
 * @param {string} props.typeId - The appointment type ID
 * @param {boolean} props.showIcon - Whether to show the icon
 * @param {boolean} props.showDuration - Whether to show the default duration
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - The rendered component
 */
const AppointmentTypeBadge = ({ 
  typeId, 
  showIcon = true,
  showDuration = false,
  className = '',
  ...props
}) => {
  const type = getAppointmentTypeById(typeId);
  
  // Generate color classes based on type
  const getColorClasses = () => {
    switch (type.color) {
      case 'blue': return 'bg-blue-600 text-white';
      case 'green': return 'bg-green-600 text-white';
      case 'red': return 'bg-red-600 text-white';
      case 'purple': return 'bg-purple-600 text-white';
      case 'teal': return 'bg-teal-600 text-white';
      case 'orange': return 'bg-orange-600 text-white';
      case 'yellow': return 'bg-yellow-500 text-black';
      default: return 'bg-gray-600 text-white';
    }
  };
  
  // Get icon (simplified for now, in a real app would use an icon library)
  const getIcon = () => {
    switch (type.icon) {
      case 'clipboard-list': return '📋';
      case 'chat': return '💬';
      case 'refresh': return '🔄';
      case 'exclamation': return '❗';
      case 'users': return '👥';
      case 'clipboard-check': return '✅';
      case 'phone': return '📞';
      default: return '📝';
    }
  };
  
  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColorClasses()} ${className}`}
      {...props}
    >
      {showIcon && (
        <span className="mr-1" aria-hidden="true">{getIcon()}</span>
      )}
      <span>
        {type.name}
        {showDuration && type.defaultDuration && ` (${type.defaultDuration} min)`}
      </span>
    </span>
  );
};

export default AppointmentTypeBadge; 