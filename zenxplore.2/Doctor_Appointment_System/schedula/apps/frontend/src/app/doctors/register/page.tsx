


"use client"

import { useState, type FormEvent, useEffect } from "react"
import { useRouter } from "next/navigation"
import { User, Mail, Lock, Phone, FileText, Award, Camera, Stethoscope, CheckCircle } from 'lucide-react'
const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
export default function DoctorRegistration() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    fullName: "",
    phone: "",
    bio: "",
    yearsOfExperience: "",
    profilePic: "",
    specialization: "",
  })
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  // Clean up preview URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.email) newErrors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format"

    if (!formData.username) newErrors.username = "Username is required"
    if (!formData.password) newErrors.password = "Password is required"
    if (!formData.fullName) newErrors.fullName = "Full name is required"

    if (!formData.phone) newErrors.phone = "Phone number is required"
    else if (!/^\+?[\d\s-]{10,}$/.test(formData.phone)) newErrors.phone = "Invalid phone number"

    if (!formData.bio) newErrors.bio = "Bio is required"
    if (!formData.yearsOfExperience) newErrors.yearsOfExperience = "Years of experience is required"
    else if (isNaN(Number(formData.yearsOfExperience)) || Number(formData.yearsOfExperience) < 0) {
      newErrors.yearsOfExperience = "Enter a valid number"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type and size (e.g., images only, max 5MB)
      const validTypes = ["image/jpeg", "image/png", "image/gif"]
      if (!validTypes.includes(selectedFile.type)) {
        setUploadError("Please upload an image (JPEG, PNG, or GIF)")
        setFile(null)
        setPreviewUrl(null)
        return
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setUploadError("File size must be less than 5MB")
        setFile(null)
        setPreviewUrl(null)
        return
      }
      setFile(selectedFile)
      setUploadError("")
      setFormData((prev) => ({ ...prev, profilePic: "" }))
      // Generate preview URL
      const url = URL.createObjectURL(selectedFile)
      setPreviewUrl(url)
    } else {
      setFile(null)
      setPreviewUrl(null)
      setUploadError("")
    }
  }

  const uploadToCloudinary = async (file: File): Promise<string> => {
    setIsUploading(true)
    setUploadError("")
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "")
      formData.append("folder", "doctor_profiles")

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || "Failed to upload image")
      }

      const data = await response.json()
      return data.secure_url
    } catch (error: any) {
      throw new Error(error.message || "Failed to upload image to Cloudinary")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus("idle")
    setErrorMessage("")

    if (!validateForm()) {
      setIsSubmitting(false)
      return
    }

    let profilePicUrl = formData.profilePic
    if (file) {
      try {
        profilePicUrl = await uploadToCloudinary(file)
      } catch (error: any) {
        setUploadError(error.message || "Failed to upload image. Please try again.")
        setIsSubmitting(false)
        return
      }
    }

    const submissionData = {
      ...formData,
      yearsOfExperience: Number.parseInt(formData.yearsOfExperience, 10),
      profilePic: profilePicUrl,
    }

    try {
      const response = await fetch(`${url}/api/auth/register-doctor`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      })

      if (!response.ok) {
        throw new Error("Registration failed")
      }

      setSubmitStatus("success")
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (error) {
      setSubmitStatus("error")
      setErrorMessage("Registration failed. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  if (submitStatus === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-emerald-100">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-emerald-600 mb-4">Registration Successful!</h2>
          <p className="text-gray-600 mb-4">Welcome to Schedula! Your doctor profile has been created successfully.</p>
          <div className="flex items-center justify-center space-x-2 text-emerald-600">
            <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
            <span className="ml-2 text-sm">Redirecting to Dashboard...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Join Schedula</h1>
          <p className="text-lg text-gray-600">Register as a healthcare professional</p>
          <div className="w-24 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mx-auto mt-4"></div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">Doctor Registration</h2>
            <p className="text-emerald-100 mt-1">Complete your professional profile</p>
          </div>

          {/* Error Alert */}
          {submitStatus === "error" && (
            <div className="mx-8 mt-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          <form className="p-8 space-y-6" onSubmit={handleSubmit}>
            {/* Personal Information Section */}
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="w-5 h-5 text-emerald-600 mr-2" />
                  Personal Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div className="md:col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                        errors.email ? "border-red-300 bg-red-50" : "border-gray-300 bg-gray-50"
                      }`}
                      placeholder="doctor@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <span className="w-4 h-4 mr-1">⚠</span>
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Username */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                        errors.username ? "border-red-300 bg-red-50" : "border-gray-300 bg-gray-50"
                      }`}
                      placeholder="dr_username"
                    />
                  </div>
                  {errors.username && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <span className="w-4 h-4 mr-1">⚠</span>
                      {errors.username}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                        errors.password ? "border-red-300 bg-red-50" : "border-gray-300 bg-gray-50"
                      }`}
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <span className="w-4 h-4 mr-1">⚠</span>
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`block w-full px-3 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                      errors.fullName ? "border-red-300 bg-red-50" : "border-gray-300 bg-gray-50"
                    }`}
                    placeholder="Dr. John Smith"
                  />
                  {errors.fullName && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <span className="w-4 h-4 mr-1">⚠</span>
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                        errors.phone ? "border-red-300 bg-red-50" : "border-gray-300 bg-gray-50"
                      }`}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <span className="w-4 h-4 mr-1">⚠</span>
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Professional Information Section */}
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Stethoscope className="w-5 h-5 text-emerald-600 mr-2" />
                  Professional Information
                </h3>
              </div>

              {/* Bio */}
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                  Professional Bio <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <FileText className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none ${
                      errors.bio ? "border-red-300 bg-red-50" : "border-gray-300 bg-gray-50"
                    }`}
                    placeholder="Tell us about your medical background, expertise, and approach to patient care..."
                  />
                </div>
                {errors.bio && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <span className="w-4 h-4 mr-1">⚠</span>
                    {errors.bio}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Years of Experience */}
                <div>
                  <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Award className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="yearsOfExperience"
                      name="yearsOfExperience"
                      type="number"
                      value={formData.yearsOfExperience}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                        errors.yearsOfExperience ? "border-red-300 bg-red-50" : "border-gray-300 bg-gray-50"
                      }`}
                      placeholder="5"
                      min="0"
                    />
                  </div>
                  {errors.yearsOfExperience && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <span className="w-4 h-4 mr-1">⚠</span>
                      {errors.yearsOfExperience}
                    </p>
                  )}
                </div>

                {/* Specialization */}
                <div>
                  <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization
                  </label>
                  <input
                    id="specialization"
                    name="specialization"
                    type="text"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-3 border border-gray-300 bg-gray-50 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    placeholder="e.g., Cardiology, Pediatrics, Internal Medicine"
                  />
                </div>
              </div>

              {/* Profile Picture */}
              <div>
                <label htmlFor="profilePic" className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture
                </label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        id="profilePic"
                        name="profilePic"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="profilePic"
                        className={`flex items-center justify-center w-full px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors hover:bg-gray-50 ${
                          uploadError ? "border-red-300 bg-red-50" : "border-gray-300"
                        }`}
                      >
                        <Camera className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">{file ? file.name : "Choose profile picture"}</span>
                      </label>
                    </div>
                    {isUploading && (
                      <div className="mt-2 flex items-center text-emerald-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600 mr-2"></div>
                        <span className="text-sm">Uploading image...</span>
                      </div>
                    )}
                    {uploadError && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <span className="w-4 h-4 mr-1">⚠</span>
                        {uploadError}
                      </p>
                    )}
                  </div>
                  {previewUrl && (
                    <div className="flex-shrink-0">
                      <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm">
                        <img
                          src={previewUrl || "/placeholder.svg"}
                          alt="Profile picture preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting || isUploading}
                className={`w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-base font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 transform hover:scale-[1.02] ${
                  isSubmitting || isUploading ? "opacity-50 cursor-not-allowed transform-none" : ""
                }`}
              >
                {isSubmitting || isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    {isUploading ? "Uploading Image..." : "Creating Account..."}
                  </>
                ) : (
                  <>
                    <Stethoscope className="w-5 h-5 mr-2" />
                    Register as Doctor
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">By registering, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  )
}






