import { createFileRoute } from '@tanstack/react-router';
import { Help } from '@/pages/Help';
export const Route = createFileRoute('/help')({head:()=>({meta:[{title:'Help — Obliqo'},{name:'description',content:'Find answers about the Obliqo obligation intelligence workspace.'},{property:'og:title',content:'Help — Obliqo'},{property:'og:description',content:'Find answers about the Obliqo obligation intelligence workspace.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:Help});
