import dynamic from 'next/dynamic';
export default dynamic(() => import('./_app.js'), { ssr: false });
