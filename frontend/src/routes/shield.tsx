import { createFileRoute } from '@tanstack/react-router';
import { Shield } from '@/pages/Shield';
export const Route = createFileRoute('/shield')({head:()=>({meta:[{title:'Obligation Shield — Obliqo'},{name:'description',content:'Protect the commitments that matter with a simple prototype commitment.'},{property:'og:title',content:'Obligation Shield — Obliqo'},{property:'og:description',content:'Protect the commitments that matter with a simple prototype commitment.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:Shield});
