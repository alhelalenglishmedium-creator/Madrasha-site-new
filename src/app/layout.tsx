import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { InstitutionProvider } from '@/context/InstitutionContext';

export const metadata: Metadata = {
  title: 'স্মার্ট অ্যাকাডেমিক পোর্টাল',
  description: 'Role-Based Madrasa and School Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.maateen.me/kalpurush/font.css"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="antialiased bg-[#f8fafc]">
        <AuthProvider>
          <InstitutionProvider>
            {children}
          </InstitutionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
