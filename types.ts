
export interface MonthlyStats {
  id: string;
  monthName: string; // Ex: "Setembro/2025"
  enviado: number;
  naoWhatsapp: number;
  semNumero: number;
  paraEnviar: number;
  totalProcessado: number; // Sum of the above
  taxaSucesso: number; // % logic from user doc
  isClosed: boolean;
  customText?: string; // Texto personalizado para a conclusão do relatório
}

export interface DeliveryRecord extends MonthlyStats {
  date: string;
}
