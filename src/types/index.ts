export type StatusAgendamento = 'confirmado' | 'pendente' | 'concluido' | 'cancelado';
export type Cliente = { id:string; nome:string; telefone:string; ultimaVisita?:string };
export type Servico = { id:string; nome:string; categoria:string; duracao:number; preco:number };
export type Agendamento = { id:string; clienteId:string; servicoId:string; data:string; horario:string; status:StatusAgendamento };
