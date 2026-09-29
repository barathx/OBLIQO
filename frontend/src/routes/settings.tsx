import { createFileRoute } from '@tanstack/react-router';
import { Settings } from '@/pages/Settings';
export const Route = createFileRoute('/settings')({head:()=>({meta:[{title:'Settings — Obliqo'},{name:'description',content:'Adjust your Obliqo workspace preferences and review demo data sources.'},{property:'og:title',content:'Settings — Obliqo'},{property:'og:description',content:'Adjust your Obliqo workspace preferences and review demo data sources.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:Settings});
