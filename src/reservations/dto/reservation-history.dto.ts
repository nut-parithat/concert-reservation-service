export type ReservationAction = 'reserve' | 'cancel';

export class ReservationHistoryDto {
  reservationId: string;
  action: ReservationAction;
  username: string;
  concertName: string;
  datetime: string;
}
