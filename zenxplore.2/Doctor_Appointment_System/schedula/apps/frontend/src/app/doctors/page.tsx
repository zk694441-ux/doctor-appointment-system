'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { 
  FiSearch, 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiUser, 
  FiChevronLeft, 
  FiChevronRight, 
  FiAlertCircle,
  FiUserCheck
} from 'react-icons/fi';

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

interface Doctor {
  id: string;
  full_name: string;
  specialization: string;
  yearsOfExperience: number;
  email: string;
  phone: string;
  bio?: string;
  profilePic?: string;
  locations?: Location[];
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');

  useEffect(() => {
    const fetchDoctors = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      try {
        const response = await axios.get(`${apiUrl}/api/doctors`,{ withCredentials: true });
       
        setDoctors(response.data);
      } catch (err) {
        setError('Failed to load doctors');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  // Filter doctors based on search and specialization
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialization = selectedSpecialization === '' || 
                                 doctor.specialization === selectedSpecialization;
    return matchesSearch && matchesSpecialization;
  });

  // Get unique specializations for filter dropdown
  const specializations = [...new Set(doctors.map(doctor => doctor.specialization))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-lg text-gray-600">Loading our amazing doctors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiAlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-4"
              >
                <FiChevronLeft className="w-4 h-4 mr-1" />
                Back to Home
              </Link>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Meet Our Doctors</h1>
              <p className="text-lg text-gray-600">Experienced healthcare professionals dedicated to your well-being</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search doctors by name or specialization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            
            {/* Specialization Filter */}
            <div className="md:w-64">
              <select
                value={selectedSpecialization}
                onChange={(e) => setSelectedSpecialization(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">All Specializations</option>
                {specializations.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredDoctors.length} of {doctors.length} doctors
          </div>
        </div>

        {/* Doctors Grid */}
        {filteredDoctors.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiUser className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No doctors found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDoctors.map((doctor) => (
              <Link
                href={`/doctors/${doctor.id}`}
                key={doctor.id}
                className="group bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
              >
                {/* Doctor Image */}
                <div className="relative h-48 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                  {doctor.profilePic ? (
                    <img 
                      src={doctor.profilePic} 
                      alt={doctor.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <FiUser className="w-10 h-10 text-white" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white bg-opacity-90 px-2 py-1 rounded-full text-xs font-medium text-gray-700">
                    {doctor.yearsOfExperience} yrs exp
                  </div>
                </div>

                {/* Doctor Info */}
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                     {doctor.full_name}
                  </h2>
                  
                  <div className="flex items-center mb-3">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                      <FiUserCheck className="w-3 h-3 text-blue-600" />
                    </div>
                    <span className="text-gray-700 font-medium">{doctor.specialization}</span>
                  </div>

                  {doctor.bio && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {doctor.bio}
                    </p>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <FiMail className="w-3 h-3 mr-2" />
                      {doctor.email}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <FiPhone className="w-3 h-3 mr-2" />
                      {doctor.phone}
                    </div>
                  </div>

                  {/* Locations */}
                  {doctor.locations && doctor.locations.length > 0 && (
                    <div className="border-t pt-4">
                      <div className="flex items-center mb-2">
                        <FiMapPin className="w-3 h-3 text-gray-500 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Locations:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {doctor.locations.slice(0, 2).map(location => (
                          <span key={location.id} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                            {location.name}
                          </span>
                        ))}
                        {doctor.locations.length > 2 && (
                          <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                            +{doctor.locations.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* View Profile Button */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between text-blue-600 group-hover:text-blue-700 transition-colors">
                      <span className="font-medium">View Profile</span>
                      <FiChevronRight className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}