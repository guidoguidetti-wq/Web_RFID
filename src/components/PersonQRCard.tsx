import React from 'react';
import { UserCircle, Briefcase, Building, Users, Tag } from 'lucide-react';

interface PersonQRCardProps {
  person: {
    people_id?: number;
    name: string;
    role?: string | null;
    company?: string | null;
    department?: string | null;
    image?: string | null;
    rfid_tag_id: string;
  };
}

export default function PersonQRCard({ person }: PersonQRCardProps) {
  const hasImage = person.image && person.image.trim() !== '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 pt-12 pb-8 px-6 text-center">
            {/* Profile Image */}
            <div className="flex justify-center mb-4">
              {hasImage ? (
                <img
                  src={person.image!}
                  alt={person.name}
                  className="w-36 h-36 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-36 h-36 rounded-full bg-white flex items-center justify-center border-4 border-white shadow-lg">
                  <UserCircle className="w-24 h-24 text-gray-400" />
                </div>
              )}
            </div>

            {/* Name */}
            <h1 className="text-3xl font-bold text-white mb-1">
              {person.name}
            </h1>

            {/* Role (if present) */}
            {person.role && (
              <p className="text-blue-100 text-lg">
                {person.role}
              </p>
            )}
          </div>

          {/* Body - Info sections */}
          <div className="p-6 space-y-4">
            {/* Company */}
            {person.company && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Building className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                    Azienda
                  </p>
                  <p className="text-gray-900 font-medium">
                    {person.company}
                  </p>
                </div>
              </div>
            )}

            {/* Department */}
            {person.department && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Users className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                    Dipartimento
                  </p>
                  <p className="text-gray-900 font-medium">
                    {person.department}
                  </p>
                </div>
              </div>
            )}

            {/* RFID Tag - Always shown */}
            <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
              <Tag className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-indigo-600 uppercase tracking-wide font-medium mb-1">
                  Badge RFID
                </p>
                <p className="text-gray-900 font-mono font-bold text-lg">
                  {person.rfid_tag_id}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6">
            <div className="text-center text-sm text-gray-500 pt-4 border-t">
              Profilo verificato
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
