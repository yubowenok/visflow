import { HistoryDiagramEvent, HistoryEventLevel, diagramEvent } from '@/store/history/types';
import { DiagramEventType } from '@/store/dataflow/types';

export const panningEvent = (to: Point, from: Point): HistoryDiagramEvent => {
  return diagramEvent(
    DiagramEventType.PANNING,
    'panning',
    { from, to},
  );
};
