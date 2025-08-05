import dynamic from 'next/dynamic';
export default dynamic(() => import('./build-a-bundle.js'), { ssr: false });
