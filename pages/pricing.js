import dynamic from 'next/dynamic';
export default dynamic(() => import('./pricing.js'), { ssr: false });
