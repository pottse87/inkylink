import dynamic from 'next/dynamic';
export default dynamic(() => import('./confirmation.js'), { ssr: false });
