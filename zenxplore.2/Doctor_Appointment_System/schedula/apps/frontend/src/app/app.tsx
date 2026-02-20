'use client';

import Link from 'next/link';

export default function App() {
  return (
    <div className="app-container">
      <nav className="navigation bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">Schedula</h1>
            <ul className="flex space-x-6">
              <li>
                <Link href="/" className="text-gray-600 hover:text-blue-600">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/doctors" className="text-gray-600 hover:text-blue-600">
                  Doctors
                </Link>
              </li>
              <li>
                <Link href="/patients" className="text-gray-600 hover:text-blue-600">
                  Patients
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {/* The page content will be rendered here by Next.js */}
      </main>
    </div>
  );
}