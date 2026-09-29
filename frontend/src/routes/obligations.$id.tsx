import { createFileRoute } from '@tanstack/react-router';
import { ObligationDetail } from '@/pages/ObligationDetail';
import { initialObligations } from '@/data/mockData';
export const Route = createFileRoute('/obligations/$id')({head:({params})=>{const title=initialObligations.find(o=>o.id===params.id)?.title||'Obligation';return {meta:[{title:`${title} — Obliqo`},{name:'description',content:`Review the details, deadline and next steps for ${title}.`},{property:'og:title',content:`${title} — Obliqo`},{property:'og:description',content:`Review the details, deadline and next steps for ${title}.`},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}},component:()=>{const {id}=Route.useParams();return <ObligationDetail id={id}/>}});
