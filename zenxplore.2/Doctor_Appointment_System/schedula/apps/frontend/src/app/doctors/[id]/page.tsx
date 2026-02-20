'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Phone, Mail, Calendar, Clock, Award, Stethoscope, User, Building2, Star, Plus, Users, CheckCircle } from 'lucide-react';
import { useRouter } from "next/navigation"

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

interface DoctorAvailability {
  id: string;
  location: Location;
  dayOfWeek: number | string;
  timeSlots: {
    startTime: string;
    endTime: string;
    maxPatients: number;
  }[];
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
  availabilities?: DoctorAvailability[];
}

interface GroupedAvailability {
  dayOfWeek: string;
  timeSlots: {
    startTime: string;
    endTime: string;
    maxPatients: number;
  }[];
}

// Add interfaces for Patient and Booking
interface Patient {
  id: string;
  full_name: string;
  email: string;
  phone: string;
}

interface Booking {
  id: string;
  patient: Patient;
  location: Location;
  date: string;
  startTime: string;
  endTime: string;
}

export default function DoctorDetailsPage() {
  const params = useParams();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchDoctorDetails = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      try {
        // Fetch doctor details
        const doctorResponse = await axios.get(`${apiUrl}/api/doctors/${params.id}`, { withCredentials: true });
        
        // Fetch doctor availabilities
        const availabilityResponse = await axios.get(`${apiUrl}/api/availability/doctor/${params.id}`, { withCredentials: true });
        
        // Combine the data
        setDoctor({
          ...doctorResponse.data,
          availabilities: availabilityResponse.data
        });
      } catch (err) {
        setError('Failed to load doctor details');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorDetails();
  }, [params.id]);

  useEffect(() => {
    // Get user role from localStorage or cookies
    let role = null;
    if (typeof window !== 'undefined') {
      try {
        const userData = localStorage.getItem('userData');
        if (userData) {
          const parsed = JSON.parse(userData);
          role = parsed.role;
        }
      } catch {}
    }
    setUserRole(role);
  }, []);

  // Fetch bookings when the user is a doctor
  useEffect(() => {
    if (userRole === 'doctor') {
      const fetchBookings = async () => {
        setBookingsLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        try {
          const res = await axios.get(`${apiUrl}/api/appointments/doctor/${params.id}`, { 
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            validateStatus: function (status) {
              return status < 500; // Resolve only if the status code is less than 500
            }
          });
          
          if (res.status === 401) {
            // Clear any existing auth data
            localStorage.removeItem('userData');
            // Redirect to login
            router.push('/login');
            return;
          }
          
          setBookings(res.data);
        } catch (err) {
          
          if (axios.isAxiosError(err) && err.response?.status === 401) {
            // Clear any existing auth data
            localStorage.removeItem('userData');
            // Redirect to login
            router.push('/login');
          }
          setBookings([]);
        } finally {
          setBookingsLoading(false);
        }
      };
      fetchBookings();
    }
  }, [userRole, params.id, router]);

  // Group availabilities by location, but filter out empty timeSlots
  const clinicAvailabilities: { [locationId: string]: { location: Location; grouped: GroupedAvailability[] } } = {};
  if (doctor?.availabilities) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    
    
    for (const av of doctor.availabilities) {
      
      // Only include availabilities with at least one time slot
      if (!av.timeSlots || av.timeSlots.length === 0) continue;
      
      const key = av.location.id;
      if (!clinicAvailabilities[key]) {
        clinicAvailabilities[key] = { location: av.location, grouped: [] };
      }
      
      // Handle both numeric and string day formats
      let dayName: string;
      if (typeof av.dayOfWeek === 'number') {
        dayName = dayNames[av.dayOfWeek];
      } else if (typeof av.dayOfWeek === 'string') {
        // If it's a number as string, convert it
        const dayIndex = parseInt(av.dayOfWeek, 10);
        if (!isNaN(dayIndex) && dayIndex >= 0 && dayIndex < 7) {
          dayName = dayNames[dayIndex];
        } else {
          // If it's already a day name, use it directly
          dayName = av.dayOfWeek;
        }
      }
      
      
      
      // Try to find a group with the same timeSlots
      const found = clinicAvailabilities[key].grouped.find(g =>
        JSON.stringify(g.timeSlots) === JSON.stringify(av.timeSlots)
      );
      
      if (found) {
        found.dayOfWeek += `, ${dayName}`;
      } else {
        clinicAvailabilities[key].grouped.push({ 
          dayOfWeek: dayName!, 
          timeSlots: av.timeSlots 
        });
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="bg-white p-10 rounded-3xl shadow-2xl border border-emerald-100">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-400 animate-pulse"></div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-800 mb-1">Loading Profile</h3>
              <p className="text-gray-500">Fetching doctor information...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="bg-white p-10 rounded-3xl shadow-2xl border border-red-100 text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-red-50 to-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Oops! Something went wrong</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <User className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Doctor Not Found</h2>
          <p className="text-gray-600 mb-6">The requested doctor profile could not be found.</p>
          <Link 
            href="/doctors"
            className="inline-flex items-center bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Doctors
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Enhanced Back Button */}
        {userRole !== 'doctor' && (
          <div className="mb-8">
            <Link 
              href="/doctors" 
              className="inline-flex items-center space-x-3 text-emerald-600 hover:text-emerald-700 transition-all duration-200 group bg-white rounded-2xl px-6 py-3 shadow-lg border border-emerald-100 hover:shadow-xl hover:border-emerald-200"
            >
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </div>
              <span className="font-semibold">Back to Doctors</span>
            </Link>
          </div>
        )}

        {/* Enhanced Main Profile Card */}
        <div className="bg-white rounded-4xl shadow-2xl overflow-hidden border border-gray-100 backdrop-blur-sm">
          {/* Enhanced Header Section with Animated Gradient */}
          <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-8 py-16 overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex flex-col xl:flex-row items-center xl:items-start space-y-8 xl:space-y-0 xl:space-x-12">
                {/* Enhanced Profile Picture */}
                <div className="relative group">
                  <div className="w-36 h-36 xl:w-48 xl:h-48 rounded-3xl overflow-hidden border-4 border-white shadow-2xl bg-white transform group-hover:scale-105 transition-transform duration-300">
                    {doctor.profilePic ? (
                      <img
                        src={doctor.profilePic || "/placeholder.svg"}
                        alt={`Dr. ${doctor.full_name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100 flex items-center justify-center">
                        <User className="w-20 h-20 xl:w-24 xl:h-24 text-emerald-600" />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-3 -right-3 w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl border-4 border-emerald-100">
                    <Stethoscope className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-emerald-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                {/* Enhanced Doctor Info */}
                <div className="text-center xl:text-left flex-1">
                  <div className="mb-6">
                    <h1 className="text-4xl xl:text-5xl font-bold text-white mb-3 leading-tight">
                      Dr. {doctor.full_name}
                    </h1>
                    <div className="flex items-center justify-center xl:justify-start space-x-3 mb-6">
                      <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white border-opacity-30">
                        <span className="text-black font-semibold text-lg">{doctor.specialization}</span>
                      </div>
                      <div className="hidden sm:flex bg-white bg-opacity-15 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white border-opacity-20">
                        <CheckCircle className="w-5 h-5 text-green-300" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center xl:justify-start gap-6 text-emerald-100">
                    <div className="flex items-center space-x-3 bg-white bg-opacity-10 backdrop-blur-sm rounded-xl px-4 py-2">
                      <Award className="w-5 h-5 text-yellow-300" />
                      <span className="font-medium text-black">{doctor.yearsOfExperience} years experience</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-white bg-opacity-10 backdrop-blur-sm rounded-xl px-4 py-2">
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current text-yellow-300" />
                        ))}
                      </div>
                      <span className="font-medium text-black">4.9 Rating</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Content Section */}
          <div className="p-8 xl:p-12">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
              {/* Left Column - Professional Info */}
              <div className="xl:col-span-2 space-y-10">
                {/* Enhanced Bio Section */}
                {doctor.bio && (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 border border-gray-200 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mr-3">
                        <User className="w-5 h-5 text-emerald-600" />
                      </div>
                      About Dr. {doctor.full_name}
                    </h2>
                    <p className="text-gray-700 leading-relaxed text-lg">{doctor.bio}</p>
                  </div>
                )}

                {/* Enhanced Practice Locations */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mr-3">
                      <Building2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    Practice Locations
                  </h2>
                  {doctor.locations && doctor.locations.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {doctor.locations.map((location, index) => (
                        <div 
                          key={location.id} 
                          className="group bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:border-emerald-200 transform hover:-translate-y-1"
                          style={{animationDelay: `${index * 100}ms`}}
                        >
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                              <MapPin className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-900 mb-3 text-lg">{location.name}</h3>
                              <div className="space-y-2 text-gray-600">
                                <p className="flex items-center">
                                  <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>
                                  {location.address}
                                </p>
                                <p className="flex items-center">
                                  <span className="w-2 h-2 bg-teal-400 rounded-full mr-2"></span>
                                  {location.city}, {location.state}
                                </p>
                                <p className="flex items-center">
                                  <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2"></span>
                                  {location.country}, {location.postalCode}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-lg">No practice locations available</p>
                    </div>
                  )}
                </div>

                {/* Enhanced Availability Schedule */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mr-3">
                      <Calendar className="w-5 h-5 text-emerald-600" />
                    </div>
                    Availability Schedule
                  </h2>
                  {Object.keys(clinicAvailabilities).length > 0 ? (
                    <div className="space-y-6">
                      {Object.values(clinicAvailabilities).map(({ location, grouped }, index) => (
                        <div 
                          key={location.id} 
                          className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-3xl p-8 shadow-sm hover:shadow-lg transition-all duration-300"
                          style={{animationDelay: `${index * 150}ms`}}
                        >
                          <div className="flex items-center mb-6">
                            <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mr-4">
                              <MapPin className="w-6 h-6 text-white" />
                            </div>
                            <span className="font-bold text-gray-900 text-xl">{location.name}</span>
                          </div>
                          <div className="space-y-4">
                            {grouped.map((group, idx) => (
                              <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100">
                                <div className="font-bold text-emerald-800 mb-4 text-lg flex items-center">
                                  <Calendar className="w-5 h-5 mr-2" />
                                  {group.dayOfWeek}
                                </div>
                                <div className="flex flex-wrap gap-3">
                                  {Array.isArray(group.timeSlots) && group.timeSlots.length > 0 ? (
                                    group.timeSlots.map((slot, i) => (
                                      <div
                                        key={i}
                                        className="bg-gradient-to-r from-emerald-100 to-teal-100 border-2 border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 font-semibold hover:from-emerald-200 hover:to-teal-200 transition-all duration-200 transform hover:scale-105"
                                      >
                                        <div className="flex items-center space-x-2">
                                          <Clock className="w-4 h-4" />
                                          <span>{slot.startTime} - {slot.endTime}</span>
                                        </div>
                                        <div className="text-xs text-emerald-600 mt-1 flex items-center">
                                          <Users className="w-3 h-3 mr-1" />
                                          {slot.maxPatients} patients max
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <span className="text-gray-500 text-sm italic">No time slots available</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-lg">No availability schedule set</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Right Column - Contact & Quick Info */}
              <div className="space-y-8">
                {/* Enhanced Contact Information Card */}
                <div className="bg-white border-2 border-gray-200 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                      <Phone className="w-4 h-4 text-emerald-600" />
                    </div>
                    Contact Information
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <Mail className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Email Address</p>
                        <p className="font-semibold text-gray-900">{doctor.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl border border-teal-100">
                      <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                        <Phone className="w-6 h-6 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Phone Number</p>
                        <p className="font-semibold text-gray-900">{doctor.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Quick Stats Card */}
                <div className="bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 rounded-3xl p-8 text-white shadow-2xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white opacity-10 rounded-3xl blur-3xl"></div>
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold mb-6 flex items-center">
                      <Award className="w-6 h-6 mr-2" />
                      Quick Stats
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-white bg-opacity-10 rounded-xl backdrop-blur-sm">
                        <span className="text-emerald-500 font-medium">Experience</span>
                        <span className="font-bold text-lg text-emerald-500">{doctor.yearsOfExperience} years</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white bg-opacity-10 rounded-xl backdrop-blur-sm">
                        <span className="text-emerald-500 font-medium">Locations</span>
                        <span className="font-bold text-lg text-emerald-500">{doctor.locations?.length || 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white bg-opacity-10 rounded-xl backdrop-blur-sm">
                        <span className="text-emerald-500 font-medium">Schedules</span>
                        <span className="font-bold text-lg text-emerald-500">{doctor.availabilities?.length || 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white bg-opacity-10 rounded-xl backdrop-blur-sm">
                        <span className="text-emerald-500 font-medium">Rating</span>
                        <div className="flex items-center space-x-2">
                          <Star className="w-5 h-5 fill-current text-yellow-300" />
                          <span className="font-bold text-lg text-emerald-500">4.9</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Enhanced Add Location Button - only for doctors */}
                    {userRole === 'doctor' && (
                      <button
                        onClick={() => router.push(`/doctors/${params.id}/add-location`)}
                        className="w-full mt-6 bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm text-emerald-500 font-semibold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3 border-2 border-white border-opacity-30 hover:border-opacity-50 transform hover:scale-105"
                      >
                       <Plus className="w-5 h-5" />
                        <span>Add New Location</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  {userRole === 'doctor' ? (
                    <button 
                      onClick={() => router.push(`/doctors/${params.id}/add-availability`)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2"
                    >
                      <Clock className="w-5 h-5" />
                      <span>Add Availability</span>
                    </button>
                  ) : userRole === 'patient' ? (
                    <button
                      onClick={() => router.push(`/doctors/${params.id}/book-slot`)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2"
                    >
                      <Calendar className="w-5 h-5" />
                      <span>Book an Appointement</span>
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Bookings Section - only for doctors */}
        {userRole === 'doctor' && (
          <div className="mt-12 bg-white rounded-4xl shadow-2xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-8">
              <h2 className="text-3xl font-bold text-white flex items-center">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mr-4">
                  <Calendar className="w-6 h-6 text-emerald-500" />
                </div>
                Your Appointments
              </h2>
            </div>
            
            <div className="p-8">
              {bookingsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600"></div>
                </div>
              ) : bookings.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {bookings.map((booking, index) => {
  // Check if appointment date has passed
  const appointmentDate = new Date(booking.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time part for date comparison
  const isPast = appointmentDate < today;
  
  // Determine card styles based on appointment status
  const cardStyles = isPast 
    ? "bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200" 
    : "bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200";
  
  return (
    <div 
      key={booking.id} 
      className={`${cardStyles} rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}
      style={{animationDelay: `${index * 100}ms`}}
    >
      {/* Status Badge */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">{booking.patient.full_name}</h3>
          <p className="text-gray-600 text-sm">{booking.patient.email}</p>
          <p className="text-gray-600 text-sm">{booking.patient.phone}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${isPast ? 'bg-gray-200 text-gray-700' : 'bg-emerald-200 text-emerald-800'}`}>
          {isPast ? 'Completed' : 'Active'}
        </div>
      </div>
      
      <div className="space-y-3 mt-4">
        <div className={`flex items-center space-x-2 ${isPast ? 'text-gray-500' : 'text-emerald-700'}`}>
          <Clock className="w-4 h-4" />
          <span className="font-semibold">{booking.startTime} - {booking.endTime}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-600">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{booking.location.name}</span>
        </div>
        
        <div className={`flex items-center space-x-2 ${isPast ? 'text-gray-500' : 'text-emerald-700'}`}>
          <Calendar className="w-4 h-4" />
          <span className="text-sm">{new Date(booking.date).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
})}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Calendar className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Appointments Yet</h3>
                  <p className="text-gray-500">Your upcoming appointments will appear here.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}