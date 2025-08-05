import dynamic from 'next/dynamic';
export default dynamic(() => import('./BundleCard.js'), { ssr: false });
