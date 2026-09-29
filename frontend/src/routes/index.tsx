import { createFileRoute } from '@tanstack/react-router';
import { Overview } from '@/pages/Overview';
export const Route = createFileRoute('/')({head:()=>({meta:[{title:'Overview — Obliqo'},{name:'description',content:'See what needs attention, what is due, and how to prepare with Obliqo.'},{property:'og:title',content:'Overview — Obliqo'},{property:'og:description',content:'See what needs attention, what is due, and how to prepare with Obliqo.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:Overview});
