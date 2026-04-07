import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import PWARegistrar from '@/components/PWARegistrar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Clinify',
    description: 'Sistema de gestão inteligente para clínicas multidisciplinares',
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'Clinify',
    },
};

export const viewport: Viewport = {
    themeColor: '#10B981',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="pt-BR">
            <body className={inter.className}>
                <AuthProvider>
                    {children}
                    <PWARegistrar />
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: '#111827',
                                color: '#FFFFFF',
                                border: '1px solid #1F2937',
                                borderRadius: '16px',
                                fontSize: '14px',
                                fontWeight: '600',
                            },
                            success: { iconTheme: { primary: '#10B981', secondary: '#111827' } },
                            error: { iconTheme: { primary: '#EF4444', secondary: '#111827' } },
                        }}
                    />
                </AuthProvider>
            </body>
        </html>
    );
}
