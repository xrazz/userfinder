/** @type {import('next').NextConfig} */
// const nextConfig = { 
    
// };



const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    eslint: {
      // Ignore ESLint errors during builds but still show them
      ignoreDuringBuilds: true,
    },
    webpack: (config, { isServer }) => {
      if (!isServer) {
        config.resolve.fallback = {
          fs: false,
        };
      }
  
      return config;
    },
  };
  
export default nextConfig;

  
