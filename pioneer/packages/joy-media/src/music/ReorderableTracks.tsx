import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { EditableMusicTrackPreviewProps, MusicTrackPreview } from './MusicTrackPreview';

// A little function to help us with reordering the result
const reorder = (list: OrderableItem[], startIndex: number, endIndex: number) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

type Props = {
  tracks: EditableMusicTrackPreviewProps[];
  onRemove?: (track: EditableMusicTrackPreviewProps) => void;
  noTracksView?: React.ReactElement;
}

type OrderableItem = EditableMusicTrackPreviewProps;

export const ReorderableTracks = (props: Props) => {
  const { tracks = [], onRemove = () => {}, noTracksView = null } = props;

  const [items, setItems] = useState(tracks);

  if (!items.length) {
    return noTracksView;
  }

  const onDragEnd = (result: DropResult) => {
    // Dropped outside the list
    if (!result.destination) {
      return;
    }

    const reorderedItems = reorder(
      items,
      result.source.index,
      result.destination.index
    );

    setItems(reorderedItems);
  };

  // Normally you would want to split things out into separate components.
  // But in this example everything is just done in one place for simplicity
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId='droppable'>
        {(provided, _snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className='JoyListOfPreviews'
          >
            {items.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <MusicTrackPreview
                      key={index}
                      {...item}
                      position={index + 1}
                      isDraggable={snapshot.isDragging}
                      withRemoveButton
                      onRemove={() => {
                        onRemove(item);
                        const lessItems = items.filter(x => x.id !== item.id);
                        setItems(lessItems);
                      }}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
