import { createFileRoute } from '@tanstack/react-router';
import { Insights } from '@/pages/Insights';
export const Route = createFileRoute('/insights')({head:()=>({meta:[{title:'Insights — Obliqo'},{name:'description',content:'See simple patterns in your upcoming commitments and recurring obligations.'},{property:'og:title',content:'Insights — Obliqo'},{property:'og:description',content:'See simple patterns in your upcoming commitments and recurring obligations.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:Insights});
