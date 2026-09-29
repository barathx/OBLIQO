import { createFileRoute } from '@tanstack/react-router';
import { Obligations } from '@/pages/Obligations';
export const Route = createFileRoute('/obligations/')({head:()=>({meta:[{title:'Obligations — Obliqo'},{name:'description',content:'Keep every important obligation and deadline in one place.'},{property:'og:title',content:'Obligations — Obliqo'},{property:'og:description',content:'Keep every important obligation and deadline in one place.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:Obligations});
