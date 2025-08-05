import dynamic from 'next/dynamic';
export default dynamic(() => import('./reconnecting.js'), { ssr: false });
