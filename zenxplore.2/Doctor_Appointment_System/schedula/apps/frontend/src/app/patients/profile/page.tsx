"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function PatientProfilePage() {
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const [showCancelModal, setShowCancelModal] = useState<{ open: boolean; bookingId?: string }>({ open: false });
  const [showRescheduleModal, setShowRescheduleModal] = useState<{ open: boolean; bookingId?: string }>({ open: false });
  const [actionLoading, setActionLoading] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<Date | null>(null);
  const [rescheduleSlotId, setRescheduleSlotId] = useState<string | number | null>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [arrivalTime, setArrivalTime] = useState<string | null>(null);
  const [rescheduleError, setRescheduleError] = useState<string>("");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        const res = await axios.get(`${apiUrl}/api/patients/profile`, { withCredentials: true });
        setProfile(res.data.profile);
        setAppointments(res.data.appointments);
      } catch (err) {
        setError("Failed to load profile. Please login again.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleCancel = async (bookingId: string) => {
    setActionLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      await axios.delete(`${apiUrl}/api/appointments/${bookingId}`, { withCredentials: true });
      setAppointments(prev => prev.filter((appt: any) => appt.bookingId !== bookingId));
      setShowCancelModal({ open: false });
    } catch (err) {
      alert("Failed to cancel appointment.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReschedule = async (bookingId: string) => {
    setShowRescheduleModal({ open: true, bookingId });
    setRescheduleDate(null);
    setRescheduleSlotId(null);
    setAvailableSlots([]);
    setArrivalTime(null);
    setRescheduleError("");
  };

  // Fetch slots for the same doctor/location as the original appointment
  const fetchAvailableSlots = async (booking: any, date: Date) => {
    setAvailableSlots([]);
    setRescheduleSlotId(null);
    setArrivalTime(null);
    setRescheduleError("");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      // Get all availabilities for the doctor at the location
      const res = await axios.get(`${apiUrl}/api/availability/doctor/${booking.doctorTimeSlot.doctorId}`,{withCredentials: true});
      const dayOfWeek = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][date.getDay()];
      const av = (res.data || []).find((a: any) => a.location?.id === booking.doctorTimeSlot.locationId && a.dayOfWeek === dayOfWeek);
      // Ensure each slot includes dayOfWeek
      setAvailableSlots(av ? av.timeSlots.map((slot: any) => ({ ...slot, dayOfWeek: av.dayOfWeek })) : []);
    } catch (err) {
      setRescheduleError("Failed to load slots for selected date.");
    }
  };

  const handleRescheduleConfirm = async () => {
    if (!showRescheduleModal.bookingId || !rescheduleDate || !rescheduleSlotId) {
      setRescheduleError("Please select a valid time slot.");
      return;
    }
    // Find slot by startTime-endTime key
    const selectedSlot = availableSlots.find(slot => `${slot.startTime}-${slot.endTime}` === rescheduleSlotId);
    if (!selectedSlot) {
      setRescheduleError("Please select a valid time slot.");
      return;
    }
    setActionLoading(true);
    setRescheduleError("");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const res = await axios.patch(`${apiUrl}/api/appointments/${showRescheduleModal.bookingId}/reschedule`, {
        date: rescheduleDate.toISOString().slice(0, 10),
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        dayOfWeek: selectedSlot.dayOfWeek,
      }, { withCredentials: true });
      setArrivalTime(res.data.arrivalTime);
      // Update appointment in state
      setAppointments(prev => prev.map((appt: any) =>
        appt.bookingId === showRescheduleModal.bookingId
          ? { ...appt, date: rescheduleDate.toISOString(), doctorTimeSlot: { ...appt.doctorTimeSlot, startTime: selectedSlot.startTime, endTime: selectedSlot.endTime, dayOfWeek: selectedSlot.dayOfWeek } }
          : appt
      ));
    } catch (err: any) {
      
      setRescheduleError(err?.response?.data?.message || "Failed to reschedule appointment.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-700 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-green-700 font-medium">No profile found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-800 mb-2">Patient Profile</h1>
          <div className="w-24 h-1 bg-gradient-to-r from-green-400 to-emerald-500 mx-auto rounded-full"></div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-green-100">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mr-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-800">Personal Information</h2>
              <p className="text-green-600">Your account details</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Full Name</p>
                  <p className="text-green-800 font-semibold">{profile.full_name}</p>
                </div>
              </div>

              <div className="flex items-center p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Email Address</p>
                  <p className="text-green-800 font-semibold">{profile.email}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Phone Number</p>
                  <p className="text-green-800 font-semibold">{profile.phone}</p>
                </div>
              </div>

              <div className="flex items-center p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-2 9a2 2 0 002 2h8a2 2 0 002-2l-2-9m-6 0V7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Member Since</p>
                  <p className="text-green-800 font-semibold">{new Date(profile.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-green-100">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center mr-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-2 9a2 2 0 002 2h8a2 2 0 002-2l-2-9m-6 0V7" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-800">Your Appointments</h2>
              <p className="text-green-600">Manage your scheduled consultations</p>
            </div>
          </div>

          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-2 9a2 2 0 002 2h8a2 2 0 002-2l-2-9m-6 0V7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-green-800 mb-2">No Appointments Yet</h3>
              <p className="text-green-600 mb-6">You haven't booked any appointments yet. Start by finding a doctor that suits your needs.</p>
              <button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                Book Your First Appointment
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {appointments.map((appt, index) => {
  // Check if appointment date has passed
  const appointmentDate = new Date(appt.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time part for date comparison
  const isPast = appointmentDate < today;
  
  return (
    <div key={appt.bookingId} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mr-4">
            <span className="text-white font-bold text-lg">{index + 1}</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-green-800">
              {appt.doctor ? `Dr. ${appt.doctor.full_name}` : "Doctor TBA"}
            </h3>
            <p className="text-green-600">{appt.doctor?.specialization || "Specialization not specified"}</p>
          </div>
        </div>
        <div className={`${isPast ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-700'} px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2`}>
          {isPast ? 'Completed' : 'Active'}
          
          {!isPast && (
            <>
              <button
                className="ml-2 px-3 py-1 rounded-lg bg-gradient-to-r from-green-400 to-emerald-500 text-white font-semibold text-xs shadow hover:from-green-500 hover:to-emerald-600 transition-all duration-200"
                onClick={() => setShowCancelModal({ open: true, bookingId: appt.bookingId })}
              >
                Cancel
              </button>
              <button
                className="ml-2 px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-green-400 text-white font-semibold text-xs shadow hover:from-emerald-600 hover:to-green-500 transition-all duration-200"
                onClick={() => handleReschedule(appt.bookingId)}
              >
                Reschedule
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p className="text-sm text-green-600">Location</p>
              <p className="font-semibold text-green-800">
                {appt.location ? `${appt.location.name}, ${appt.location.city}` : "Location TBA"}
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-2 9a2 2 0 002 2h8a2 2 0 002-2l-2-9m-6 0V7" />
            </svg>
            <div>
              <p className="text-sm text-green-600">Booked On</p>
              <p className="font-semibold text-green-800">{appt.createdAt ? new Date(appt.createdAt).toLocaleDateString() : "-"}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm text-green-600">Time Slot</p>
              <p className="font-semibold text-green-800">
                {appt.doctorTimeSlot.startTime} - {appt.doctorTimeSlot.endTime}
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-2 9a2 2 0 002 2h8a2 2 0 002-2l-2-9m-6 0V7" />
            </svg>
            <div>
              <p className="text-sm text-green-600">Day</p>
              <p className="font-semibold text-green-800">{appt.doctorTimeSlot.dayOfWeek}</p>
            </div>
          </div>

          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-2 9a2 2 0 002 2h8a2 2 0 002-2l-2-9m-6 0V7" />
            </svg>
            <div>
              <p className="text-sm text-green-600">Booking Date</p>
              <p className="font-semibold text-green-800">{appt.date ? new Date(appt.date).toLocaleDateString() : "-"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
})}

              {/* Cancel Confirmation Modal */}
              {showCancelModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full border border-green-200 animate-in fade-in">
                    <h3 className="text-xl font-bold text-green-800 mb-4">Cancel Appointment?</h3>
                    <p className="text-green-700 mb-6">Are you sure you want to cancel this appointment? This action cannot be undone.</p>
                    <div className="flex justify-end gap-3">
                      <button
                        className="px-4 py-2 rounded-lg bg-gray-100 text-green-700 font-semibold hover:bg-gray-200 transition-all"
                        onClick={() => setShowCancelModal({ open: false })}
                        disabled={actionLoading}
                      >
                        No, Keep
                      </button>
                      <button
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:from-green-600 hover:to-emerald-700 transition-all"
                        onClick={() => handleCancel(showCancelModal.bookingId!)}
                        disabled={actionLoading}
                      >
                        {actionLoading ? "Cancelling..." : "Yes, Cancel"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Reschedule Modal */}
              {showRescheduleModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-green-200 animate-in fade-in">
                    <h3 className="text-xl font-bold text-green-800 mb-4">Reschedule Appointment</h3>
                    <p className="text-green-700 mb-4">Select a new date and time slot for your appointment.</p>
                    <div className="mb-4">
                      <label className="block text-green-700 font-medium mb-2">Date</label>
                      <DatePicker
                        selected={rescheduleDate}
                        onChange={(date: Date | null) => {
                          setRescheduleDate(date);
                          if (date) {
                            const booking = appointments.find((a: any) => a.bookingId === showRescheduleModal.bookingId);
                            if (booking) fetchAvailableSlots(booking, date);
                          } else {
                            setAvailableSlots([]);
                            setRescheduleSlotId(null);
                          }
                        }}
                        minDate={new Date()}
                        className="w-full p-2 border border-green-200 rounded-lg"
                        placeholderText="Select a date"
                      />
                    </div>
                    {availableSlots.length > 0 && (
                      <div className="mb-4">
                        <label className="block text-green-700 font-medium mb-2">Time Slot</label>
                        <div className="grid grid-cols-2 gap-2">
                          {availableSlots.map((slot) => {
                            const slotKey = `${slot.startTime}-${slot.endTime}`;
                            const isSelected = rescheduleSlotId === slotKey;
                            return (
                              <button
                                key={slotKey}
                                className={`px-3 py-2 rounded-lg border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-150 ${isSelected ? "bg-emerald-500 text-white border-emerald-600" : "bg-green-50 text-green-800 border-green-200 hover:bg-green-100"}`}
                                onClick={() => setRescheduleSlotId(slotKey)}
                                type="button"
                                aria-pressed={isSelected}
                                tabIndex={0}
                              >
                                {slot.startTime} - {slot.endTime}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {rescheduleError && <div className="text-red-600 mb-2 text-sm">{rescheduleError}</div>}
                    {arrivalTime && (
                      <div className="mb-2 text-green-700 font-medium">Arrive at: <span className="font-bold">{arrivalTime}</span></div>
                    )}
                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        className="px-4 py-2 rounded-lg bg-gray-100 text-green-700 font-semibold hover:bg-gray-200 transition-all"
                        onClick={() => setShowRescheduleModal({ open: false })}
                        disabled={actionLoading}
                      >
                        Cancel
                      </button>
                      <button
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold hover:from-emerald-600 hover:to-green-600 transition-all"
                        onClick={handleRescheduleConfirm}
                        disabled={actionLoading || !rescheduleDate || !rescheduleSlotId}
                      >
                        {actionLoading ? "Rescheduling..." : "Confirm"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}