import Link from 'next/link';

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50">
      {/* Navbar removed: now provided globally via layout.tsx */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="py-12">
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Welcome to Schedula</span>
              <span className="block text-emerald-600">Your Healthcare Scheduling Solution</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-600 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Schedule appointments with healthcare professionals easily and efficiently. 
              Join our platform to experience seamless healthcare scheduling.
            </p>
            <div className="mt-8 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-lg shadow">
                <Link
                  href="/patients/register"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 transition-colors duration-200 md:py-4 md:text-lg md:px-10"
                >
                  Register as Patient
                </Link>
              </div>
              <div className="mt-3 rounded-lg shadow sm:mt-0 sm:ml-3">
                <Link
                  href="/doctors/register"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-emerald-600 bg-white hover:bg-gray-50 transition-colors duration-200 md:py-4 md:text-lg md:px-10"
                >
                  Register as Doctor
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-20">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="text-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-emerald-100 text-emerald-600 mx-auto">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">Quick Scheduling</h3>
                <p className="mt-2 text-gray-600">Book appointments with just a few clicks</p>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-emerald-100 text-emerald-600 mx-auto">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">Verified Doctors</h3>
                <p className="mt-2 text-gray-600">All healthcare professionals are verified</p>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-emerald-100 text-emerald-600 mx-auto">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">Reminders</h3>
                <p className="mt-2 text-gray-600">Get notifications for your appointments</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}