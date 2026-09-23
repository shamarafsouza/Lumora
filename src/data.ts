import type { Agendamento, Cliente, Servico } from './types';
export const clientes: Cliente[] = [
  {id:'1',nome:'Mariana Silva',telefone:'5527999990001',ultimaVisita:'22/10/2026'},
  {id:'2',nome:'Beatriz Costa',telefone:'5527999990002',ultimaVisita:'23/10/2026'},
  {id:'3',nome:'Carla Rezende',telefone:'5527999990003',ultimaVisita:'Hoje às 14:00'},
  {id:'4',nome:'Fernanda Lima',telefone:'5527999990004',ultimaVisita:'15/10/2026'},
  {id:'5',nome:'Amanda Marques',telefone:'5527999990005',ultimaVisita:'08/10/2026'},
  {id:'6',nome:'Juliana Rocha',telefone:'5527999990006',ultimaVisita:'28/09/2026'},
];
export const servicos: Servico[] = [
 {id:'1',nome:'Alongamento em Fibra de Vidro',categoria:'Alongamento & Manutenção',duracao:120,preco:180},
 {id:'2',nome:'Manutenção de Alongamento',categoria:'Alongamento & Manutenção',duracao:90,preco:110},
 {id:'3',nome:'Banho de Gel',categoria:'Alongamento & Manutenção',duracao:75,preco:95},
 {id:'4',nome:'Blindagem de Unhas',categoria:'Alongamento & Manutenção',duracao:60,preco:80},
 {id:'5',nome:'Pé e Mão Simples',categoria:'Clássicos Pé & Mão',duracao:60,preco:65},
 {id:'6',nome:'Manicure Simples',categoria:'Clássicos Pé & Mão',duracao:35,preco:35},
 {id:'7',nome:'Pedicure Simples',categoria:'Clássicos Pé & Mão',duracao:40,preco:40},
 {id:'8',nome:'Esmaltação em Gel',categoria:'Clássicos Pé & Mão',duracao:45,preco:55},
];
export const agendamentos: Agendamento[] = [
 {id:'1',clienteId:'1',servicoId:'2',data:'2026-10-24',horario:'08:00',status:'confirmado'},
 {id:'2',clienteId:'2',servicoId:'5',data:'2026-10-24',horario:'10:00',status:'pendente'},
 {id:'3',clienteId:'3',servicoId:'1',data:'2026-10-24',horario:'14:00',status:'confirmado'},
];
