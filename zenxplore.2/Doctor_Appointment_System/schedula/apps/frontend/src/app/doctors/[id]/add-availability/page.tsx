'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Clock } from 'lucide-react';
import axios from 'axios';

interface Location {
  id: string;
  name: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  maxPatients: number;
}

interface AvailabilityForm {
  locationId: string;
  dayOfWeek: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  timeSlots: TimeSlot[];
}

export default function AddAvailabilityPage() {
  const params = useParams();
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fetchingSlots, setFetchingSlots] = useState(false);

  const daysOfWeek = [
    { value: 'Sunday', label: 'Sunday' },
    { value: 'Monday', label: 'Monday' },
    { value: 'Tuesday', label: 'Tuesday' },
    { value: 'Wednesday', label: 'Wednesday' },
    { value: 'Thursday', label: 'Thursday' },
    { value: 'Friday', label: 'Friday' },
    { value: 'Saturday', label: 'Saturday' }
  ];

  const [formData, setFormData] = useState<AvailabilityForm>({
    locationId: '',
    dayOfWeek: 'Sunday',
    timeSlots: [{ startTime: '09:00', endTime: '17:00', maxPatients: 1 }]
  });

  // Fetch locations on mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const response = await axios.get(`${apiUrl}/api/doctors/${params.id}`,{ withCredentials: true });
        setLocations(response.data.locations || []);
        if (response.data.locations?.length > 0) {
          setFormData(prev => ({ ...prev, locationId: response.data.locations[0].id }));
        }
      } catch (err) {
        setError('Failed to load locations');
      }
    };
    fetchLocations();
  }, [params.id]);

  // Fetch existing time slots for selected location and day
  useEffect(() => {
    if (!formData.locationId || !formData.dayOfWeek) return;
    const fetchExistingSlots = async () => {
      setFetchingSlots(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const response = await axios.get(`${apiUrl}/api/availability/doctor/${params.id}`,{ withCredentials: true });
        // Find the availability for the selected location and day
        const found = (response.data || []).find((av: any) =>
          av.location?.id === formData.locationId && av.dayOfWeek === formData.dayOfWeek
        );
        if (found && found.timeSlots.length > 0) {
          setFormData(prev => ({ ...prev, timeSlots: found.timeSlots }));
        } else {
          setFormData(prev => ({ ...prev, timeSlots: [] }));
        }
      } catch (err) {
      
      } finally {
        setFetchingSlots(false);
      }
    };
    fetchExistingSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.locationId, formData.dayOfWeek, params.id]);

  const handleAddTimeSlot = () => {
    setFormData(prev => ({
      ...prev,
      timeSlots: [
        ...prev.timeSlots,
        { startTime: '', endTime: '', maxPatients: 0 }
      ]
    }));
  };

  const handleRemoveTimeSlot = (index: number) => {
    if (formData.timeSlots.length > 1) {
      setFormData(prev => ({
        ...prev,
        timeSlots: prev.timeSlots.filter((_, i) => i !== index)
      }));
    }
  };

  const handleTimeSlotChange = (index: number, field: keyof TimeSlot, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.map((slot, i) => 
        i === index ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      
      const res=await axios.post<{ success: boolean; message?: string }>(`${apiUrl}/api/availability/doctor`, formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (res.data.success === false) {
      setError(res.data.message || 'Availability not added successfully');
      } else {
      setSuccess('Availability added successfully');
      setTimeout(() => {
        router.push(`/doctors/${params.id}`);
      }, 2000);
      }

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add availability');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link 
          href={`/doctors/${params.id}`} 
          className="inline-flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 mb-8 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Doctor Profile</span>
        </Link>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="flex items-center space-x-3 mb-8">
            <Clock className="w-8 h-8 text-emerald-600" />
            <h1 className="text-2xl font-bold text-gray-900">Add Availability</h1>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-600">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <select
                value={formData.locationId}
                onChange={(e) => setFormData(prev => ({ ...prev, locationId: e.target.value }))}
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                required
              >
                <option value="">Select a location</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Day of Week Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Day of Week
              </label>
              <select
                value={formData.dayOfWeek}
                onChange={(e) => setFormData(prev => ({ ...prev, dayOfWeek: e.target.value as 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' }))}
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                required
              >
                {daysOfWeek.map(day => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Slots */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Time Slots
                </label>
                <button
                  type="button"
                  onClick={handleAddTimeSlot}
                  className="inline-flex items-center space-x-2 text-emerald-600 hover:text-emerald-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Slot</span>
                </button>
              </div>
              {fetchingSlots && <div className="text-gray-500 mb-2">Loading existing slots...</div>}
              <div className="space-y-4">
                {formData.timeSlots.map((slot, index) => (
                  <div key={index} className="flex items-center space-x-4 bg-gray-50 p-4 rounded-xl">
                    <div className="grid grid-cols-3 gap-4 flex-1">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                        {/* Replace with a clock picker in production, e.g., react-clock or react-time-picker */}
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => handleTimeSlotChange(index, 'startTime', e.target.value)}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 clock-input"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">End Time</label>
                        {/* Replace with a clock picker in production, e.g., react-clock or react-time-picker */}
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => handleTimeSlotChange(index, 'endTime', e.target.value)}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 clock-input"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Max Patients</label>
                        <input
                          type="number"
                          min="0"
                          value={slot.maxPatients}
                          onChange={(e) => handleTimeSlotChange(index, 'maxPatients', parseInt(e.target.value))}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                          required
                        />
                      </div>
                    </div>
                    {formData.timeSlots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTimeSlot(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Clock className="w-5 h-5" />
                  <span>Add Availability</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* Add some custom CSS for a more modern clock input look */
// In your global.css or a style tag:
// .clock-input::-webkit-calendar-picker-indicator {
//   filter: invert(40%) sepia(80%) saturate(300%) hue-rotate(120deg);
//   cursor: pointer;
// }