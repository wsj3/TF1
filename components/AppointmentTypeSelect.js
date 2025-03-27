import React, { useState } from 'react';
import { getFilteredAppointmentTypes, getAppointmentTypeById } from '../utils/appointmentUtils';
import AppointmentTypeBadge from './AppointmentTypeBadge';

/**
 * Dropdown component for selecting appointment types
 * 
 * @param {Object} props - Component props
 * @param {string} props.value - Currently selected appointment type ID
 * @param {Function} props.onChange - Function called when selection changes
 * @param {boolean} props.required - Whether the field is required
 * @param {boolean} props.showDescription - Whether to show appointment type descriptions
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - The rendered component
 */
const AppointmentTypeSelect = ({
  value = 'regular',
  onChange,
  required = false,
  showDescription = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const appointmentTypes = getFilteredAppointmentTypes();
  const selectedType = getAppointmentTypeById(value) || appointmentTypes[0];
  
  // Handle selection of a type
  const handleSelect = (type) => {
    if (onChange) {
      onChange(type.id, type);
    }
    setIsOpen(false);
  };
  
  return (
    <div className={`relative ${className}`}>
      {/* Selected type display - acts as dropdown toggle */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-2 cursor-pointer bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        tabIndex={0}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center">
          <AppointmentTypeBadge typeId={selectedType.id} showIcon={true} />
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      
      {/* Dropdown options */}
      {isOpen && (
        <div
          className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto"
          role="listbox"
        >
          <ul className="py-1">
            {appointmentTypes.map((type) => (
              <li
                key={type.id}
                onClick={() => handleSelect(type)}
                className={`px-3 py-2 cursor-pointer hover:bg-gray-700 ${value === type.id ? 'bg-gray-700' : ''}`}
                role="option"
                aria-selected={value === type.id}
              >
                <div className="flex items-center">
                  <AppointmentTypeBadge typeId={type.id} showIcon={true} />
                </div>
                {showDescription && type.description && (
                  <p className="mt-1 ml-8 text-sm text-gray-400">{type.description}</p>
                )}
                {showDescription && (
                  <p className="mt-1 ml-8 text-sm text-gray-400">
                    Default duration: {type.defaultDuration} minutes
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Hidden native select for form submission */}
      <select
        name="appointmentType"
        value={value}
        onChange={(e) => {
          const typeId = e.target.value;
          const type = getAppointmentTypeById(typeId);
          if (onChange && type) {
            onChange(typeId, type);
          }
        }}
        required={required}
        className="sr-only"
        aria-hidden="true"
      >
        {appointmentTypes.map((type) => (
          <option key={type.id} value={type.id}>
            {type.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default AppointmentTypeSelect; 