import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MobileHelplineBar from './MobileHelplineBar';
import { Toaster } from '@/components/ui/sonner';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F0]">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <MobileHelplineBar />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#081428',
            color: '#F5F5F0',
            border: '1px solid #2A3244',
            borderRadius: 0,
          },
        }}
      />
    </div>
  );
}
