export interface Turno {
  id: number;
  created_at: string;
  paciente_id: string;
  especialista_id: string;
  especialidad: string;
  fecha: string; 
  estado: string;
  resena?: string;
  historia_clinica: boolean;
  calificacion?: string;
}
