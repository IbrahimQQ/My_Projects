import React from 'react';
import { PenTool } from 'lucide-react';

const DailyRecords = () => {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Daily Records</h1><p className="text-gray-500">Record daily class activities and topics</p></div>
      <div className="card text-center py-12"><PenTool size={48} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-500">Daily records feature - Record topics taught, homework, and class notes</p></div>
    </div>
  );
};

export default DailyRecords;
