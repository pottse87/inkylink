import dynamic from 'next/dynamic';
export default dynamic(() => import('./forms.js'), { ssr: false });
