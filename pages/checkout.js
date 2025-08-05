import dynamic from 'next/dynamic';
export default dynamic(() => import('./checkout.js'), { ssr: false });
