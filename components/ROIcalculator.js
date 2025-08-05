import dynamic from 'next/dynamic';
export default dynamic(() => import('./ROIcalculator.js'), { ssr: false });
