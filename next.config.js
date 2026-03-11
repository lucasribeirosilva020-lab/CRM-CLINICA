/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['ui-avatars.com'],
    },
    experimental: {
        serverComponentsExternalPackages: ['whatsapp-web.js', 'puppeteer', 'socket.io'],
    },
    transpilePackages: ['lucide-react'],
};

module.exports = nextConfig;
