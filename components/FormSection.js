import dynamic from 'next/dynamic';
export default dynamic(() => import('./FormSection.js'), { ssr: false });
