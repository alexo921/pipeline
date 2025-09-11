import React, { useState } from 'react';
import { X, Send, Users, Clock } from 'lucide-react';

interface PulseModalProps {
  isOpen: boolean;
  onClose: () => void;
  audience: string;
}

export const PulseModal: React.FC<PulseModalProps> = ({ isOpen, onClose, audience }) => {
  const [questions, setQuestions] = useState([
    'How is your energy this week?',
    'Do you feel supported by your team?',
    'How was your workload this shift?'
  ]);
  const [delivery, setDelivery] = useState('email');
  const [schedule, setSchedule] = useState('now');

  const handleSendPulse = () => {
    console.log('Sending pulse survey:', { audience, questions, delivery, schedule });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg lg:rounded-xl xl:rounded-[20px] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#2466D0] text-white px-6 py-4 rounded-t-lg lg:rounded-t-xl xl:rounded-t-[20px] flex items-center justify-between">
          <h2 className="text-[25px] font-bold leading-[34px] font-avenir">Send Targeted Pulse</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Audience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audience (locked)
            </label>
            <div className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-gray-600">
              {audience}
            </div>
          </div>

          {/* Questions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Questions
            </label>
            <div className="space-y-3">
              {questions.map((question, index) => (
                <div key={index}>
                  <label className="block text-xs text-gray-500 mb-1">Q{index + 1}</label>
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => {
                      const newQuestions = [...questions];
                      newQuestions[index] = e.target.value;
                      setQuestions(newQuestions);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2466D0]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Delivery and Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery
              </label>
              <select
                value={delivery}
                onChange={(e) => setDelivery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2466D0]"
              >
                <option value="email">Email (anonymous link)</option>
                <option value="sms">SMS (anonymous link)</option>
                <option value="in_app">In-app notification</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule
              </label>
              <select
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2466D0]"
              >
                <option value="now">Send now</option>
                <option value="tomorrow">Send tomorrow</option>
                <option value="next_week">Send next week</option>
              </select>
            </div>
          </div>

          {/* Anonymity Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              Responses are anonymous. Managers see aggregates only.
            </p>
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
              onClick={handleSendPulse}
              className="px-6 py-2 bg-[#2466D0] text-white rounded-lg hover:bg-[#2466D0]/90 transition-colors flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Send Pulse</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
