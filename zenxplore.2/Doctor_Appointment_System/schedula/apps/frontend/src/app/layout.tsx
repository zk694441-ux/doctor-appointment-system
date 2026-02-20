import './global.css';
import Navbar from './components/Navbar';

export const metadata = {
  title: 'Schedula - Doctor Management',
  description: 'Manage and view doctor information',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <Navbar />
        <div style={{ paddingTop: '4rem' }}>{children}</div>
      </body>
    </html>
  );
}
