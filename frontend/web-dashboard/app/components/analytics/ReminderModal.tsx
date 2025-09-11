import React, { useState } from 'react';
import { X, Send, Mail, Clock } from 'lucide-react';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipients: string;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({ isOpen, onClose, recipients }) => {
  const [template, setTemplate] = useState(
    'Hi {first_name}, quick reminder for your {event_time} interview at {facility_name}. Reply if you need to reschedule. Here\'s the map: {map_link}'
  );
  const [channel, setChannel] = useState('email');
  const [timing, setTiming] = useState('now');

  const handleSendReminders = () => {
    console.log('Sending reminders:', { recipients, template, channel, timing });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg lg:rounded-xl xl:rounded-[20px] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#2466D0] text-white px-6 py-4 rounded-t-lg lg:rounded-t-xl xl:rounded-t-[20px] flex items-center justify-between">
          <h2 className="text-[25px] font-bold leading-[34px] font-avenir">Trigger Candidate Reminder</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Recipients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipients (locked)
            </label>
            <div className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-gray-600">
              {recipients}
            </div>
          </div>

          {/* Template */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template
            </label>
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2466D0] resize-none"
              placeholder="Enter your message template..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Use placeholders: {'{first_name}'}, {'{event_time}'}, {'{facility_name}'}, {'{map_link}'}
            </p>
          </div>

          {/* Channel and Timing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Channel
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2466D0]"
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="both">Email + SMS</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timing
              </label>
              <select
                value={timing}
                onChange={(e) => setTiming(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2466D0]"
              >
                <option value="now">Send now</option>
                <option value="tomorrow">Send tomorrow</option>
                <option value="24h_before">24 hours before</option>
                <option value="2h_before">2 hours before</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSendReminders}
              className="px-6 py-2 bg-[#2466D0] text-white rounded-lg hover:bg-[#2466D0]/90 transition-colors flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Send Reminders</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
