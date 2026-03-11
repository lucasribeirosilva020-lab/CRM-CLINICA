import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'CRM Clínica',
    description: 'Sistema de gestão para clínicas multidisciplinares',
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'CRM Clínica',
    },
};

export const viewport: Viewport = {
    themeColor: '#1A73E8',
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
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: '#fff',
                                color: '#1C1C1E',
                                border: '1px solid #E0E0E0',
                                borderRadius: '12px',
                                fontSize: '14px',
                                fontWeight: '500',
                            },
                            success: { iconTheme: { primary: '#34A853', secondary: '#fff' } },
                            error: { iconTheme: { primary: '#EA4335', secondary: '#fff' } },
                        }}
                    />
                </AuthProvider>
            </body>
        </html>
    );
}
