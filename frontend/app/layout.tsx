import type { Metadata } from 'next';
import './globals.css';
import ThemeProvider from '../components/ThemeProvider';

export const metadata: Metadata = {
  title: 'Construction CRM',
  description: 'Construction Materials CRM System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
