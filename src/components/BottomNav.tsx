import { CalendarDays, ChartNoAxesColumnIncreasing, Sparkles, Users } from 'lucide-react';
import type { ReactNode } from 'react';
export type Page = 'agenda'|'financeiro'|'servicos'|'clientes';
const items:[Page,string,ReactNode][]=[['agenda','Agenda',<CalendarDays/>],['financeiro','Financeiro',<ChartNoAxesColumnIncreasing/>],['servicos','Serviços',<Sparkles/>],['clientes','Clientes',<Users/>]];
export function BottomNav({page,onChange}:{page:Page;onChange:(p:Page)=>void}){return <nav className="bottom-nav">{items.map(([id,label,icon])=><button className={page===id?'active':''} key={id} onClick={()=>onChange(id)}>{icon}<span>{label}</span></button>)}</nav>}
