
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
}

export interface DeliveryRecord extends MonthlyStats {
  date: string;
}
