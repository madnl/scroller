import * as React from 'react';
import View from './View';

type Props<ContextT> = {
  context: ContextT;
  label: string;
  color: string;
  onInsertAbove: (context: ContextT) => void;
  onInsertBelow: (context: ContextT) => void;
};

export default function Box<ContextT>({
  label,
  color,
  onInsertAbove,
  onInsertBelow,
  context
}: Props<ContextT>) {
  const [height, setHeight] = React.useState(100);

  const handleInsertAbove = React.useCallback(() => {
    onInsertAbove(context);
  }, [context, onInsertAbove]);

  const handleInsertBelow = React.useCallback(() => {
    onInsertBelow(context);
  }, [context, onInsertBelow]);

  const increaseHeight = React.useCallback(() => {
    setHeight(height + 50);
  }, [height]);

  const decreaseHeight = React.useCallback(() => {
    setHeight(Math.max(50, height - 50));
  }, [height]);

  return (
    <View
      direction='row'
      style={{
        backgroundColor: color,
        height: `${height}px`,
        color: '#fff',
        fontSize: '1.5rem',
        fontFamily: 'sans-serif'
      }}
    >
      <View>
        <button onClick={handleInsertAbove}>↑</button>
        <button onClick={handleInsertBelow}>↓</button>
      </View>
      <View>{label}</View>
      <View>
        <button onClick={increaseHeight}>+</button>
        <button onClick={decreaseHeight}>-</button>
      </View>
    </View>
  );
}
