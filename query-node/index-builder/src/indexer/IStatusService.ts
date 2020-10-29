export interface IStatusService {
  getIndexerHead(): Promise<number>;
  isComplete(h: number): Promise<boolean>
}