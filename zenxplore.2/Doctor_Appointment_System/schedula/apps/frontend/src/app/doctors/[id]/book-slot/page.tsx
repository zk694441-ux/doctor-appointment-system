"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, MapPin, Clock, Sparkles, CheckCircle, ArrowRight } from "lucide-react";

export default function BookSlotPage() {
  const router = useRouter();
  const params = useParams();
  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slotsForDate, setSlotsForDate] = useState([]);

  useEffect(() => {
    const fetchAvailabilities = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        const res = await axios.get(`${apiUrl}/api/availability/doctor/${params.id}`);
        setAvailabilities(res.data);
      } catch (err) {
        setError("Failed to load slots");
      } finally {
        setLoading(false);
      }
    };
    fetchAvailabilities();
  }, [params.id]);

  // Extract unique locations from availabilities
  const locations = Array.from(new Set(availabilities.map(av => av.location?.id)))
    .map(id => availabilities.find(av => av.location?.id === id)?.location)
    .filter(Boolean);

  // Compute available days for the selected location
  const availableDays = selectedLocation
    ? Array.from(new Set(availabilities
        .filter(av => av.location?.id === selectedLocation)
        .map(av => av.dayOfWeek)
      ))
    : [];

  // When location or date changes, filter slots
  useEffect(() => {
    if (!selectedLocation || !selectedDate) {
      setSlotsForDate([]);
      return;
    }
    const dayOfWeek = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][selectedDate.getDay()];
    const av = availabilities.find(av => av.location?.id === selectedLocation && av.dayOfWeek === dayOfWeek);
    setSlotsForDate(av ? av.timeSlots : []);
  }, [selectedLocation, selectedDate, availabilities]);

  const handleBook = async (slot) => {
    if (!selectedLocation || !selectedDate) return;
    const dayOfWeek = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][selectedDate.getDay()];
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const res = await axios.post(`${apiUrl}/api/appointments`, {
        doctorId: params.id,
        locationId: selectedLocation,
        dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        date: selectedDate.toISOString().slice(0, 10)
      }, { withCredentials: true });
      toast.success(`Slot booked! Arrive at ${res.data.arrivalTime} for your appointment.`);
    } catch (err) {
      toast.error(`Failed to book slot: ${err.response?.data?.message || "Unknown error"}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
            <Sparkles className="w-6 h-6 text-emerald-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-emerald-700 font-medium">Loading your perfect slots...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 flex items-center justify-center p-8">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">😔</span>
          </div>
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-200/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <Toaster 
        position="top-center"
        toastOptions={{
          className: 'bg-white/90 backdrop-blur-lg border border-emerald-200',
          duration: 4000,
        }}
      />
      
      <div className="relative z-10 max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-100/80 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-emerald-200/50">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-700 font-medium text-sm">Book Your Perfect Slot</span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
            Reserve Your Time
          </h1>
          <p className="text-emerald-600/80 text-lg max-w-md mx-auto">
            Choose your preferred location, pick a date, and secure your appointment in just a few clicks
          </p>
        </div>

        {locations.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-12 shadow-2xl border border-white/20 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Locations Available</h3>
            <p className="text-gray-500">Please check back later for available booking slots.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Step 1: Select Location */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20 transition-all duration-300 hover:shadow-3xl hover:scale-[1.02]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">1</div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Select Location</h3>
                  <p className="text-emerald-600/80">Choose your preferred clinic</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {locations.map(loc => (
                  <button
                    key={loc.id}
                    onClick={() => setSelectedLocation(loc.id)}
                    className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                      selectedLocation === loc.id
                        ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-200/50'
                        : 'border-gray-200 bg-white hover:border-emerald-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <MapPin className={`w-6 h-6 ${selectedLocation === loc.id ? 'text-emerald-600' : 'text-gray-400'}`} />
                      {selectedLocation === loc.id && (
                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                      )}
                    </div>
                    <h4 className={`font-semibold text-left ${selectedLocation === loc.id ? 'text-emerald-700' : 'text-gray-700'}`}>
                      {loc.name}
                    </h4>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Select Date */}
            {selectedLocation && (
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20 transition-all duration-500 animate-in slide-in-from-bottom-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">2</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Select Date</h3>
                    <p className="text-emerald-600/80">Pick your preferred appointment date</p>
                  </div>
                </div>

                {availableDays.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-5 h-5 text-emerald-600" />
                      <span className="font-medium text-gray-700">Available Days:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {availableDays.map(day => (
                        <span 
                          key={day} 
                          className="px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 rounded-full text-sm font-semibold border border-emerald-200/50 shadow-sm"
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="relative">
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date: Date | null) => setSelectedDate(date)}
                    minDate={new Date()}
                    className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm text-lg"
                    placeholderText="Choose your perfect date..."
                    calendarClassName="shadow-2xl border-0 rounded-3xl"
                  />
                  <Calendar className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-500 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Step 3: Available Slots */}
            {selectedLocation && selectedDate && (
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20 transition-all duration-500 animate-in slide-in-from-bottom-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">3</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Available Slots</h3>
                    <p className="text-emerald-600/80">Select your preferred time</p>
                  </div>
                </div>

                {slotsForDate.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-600 mb-2">No Slots Available</h4>
                    <p className="text-gray-500">Please try selecting a different date.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {slotsForDate.map((slot, idx) => (
                      <button
                        key={idx}
                        className="group p-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-emerald-200/50 relative overflow-hidden"
                        onClick={() => handleBook(slot)}
                      >
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10">
                          <Clock className="w-5 h-5 mx-auto mb-2" />
                          <div className="font-semibold text-sm">
                            {slot.startTime}
                          </div>
                          <div className="text-xs opacity-90">
                            {slot.endTime}
                          </div>
                          <ArrowRight className="w-4 h-4 mx-auto mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-1" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}