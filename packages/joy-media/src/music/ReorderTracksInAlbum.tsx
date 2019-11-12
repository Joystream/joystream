import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { MusicTrackPreviewProps, MusicTrackPreview } from './MusicAlbumTracks';

// A little function to help us with reordering the result
const reorder = (list: OrderableItem[], startIndex: number, endIndex: number) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

type Props = {
  tracks: MusicTrackPreviewProps[]
}

type OrderableItem = MusicTrackPreviewProps & {
  id: string
}

export const ReorderTracksInAlbum = (props: Props) => {
  
  const [items, setItems] = useState(
    props.tracks.map<OrderableItem>(
      (x, i) => ({ ...x, id: `item-${i}` })));

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
  }

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
}
