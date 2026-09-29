import { createFileRoute } from '@tanstack/react-router';
import { Activity } from '@/pages/Activity';
export const Route = createFileRoute('/activity')({head:()=>({meta:[{title:'Activity — Obliqo'},{name:'description',content:'Follow a clear history of your obligations, plans, and commitments.'},{property:'og:title',content:'Activity — Obliqo'},{property:'og:description',content:'Follow a clear history of your obligations, plans, and commitments.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:Activity});
