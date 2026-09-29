import { createFileRoute } from '@tanstack/react-router';
import { FutureFund } from '@/pages/FutureFund';
export const Route = createFileRoute('/future-fund')({head:()=>({meta:[{title:'Future Fund — Obliqo'},{name:'description',content:'Prepare gradually for expenses you already know are coming.'},{property:'og:title',content:'Future Fund — Obliqo'},{property:'og:description',content:'Prepare gradually for expenses you already know are coming.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:FutureFund});
