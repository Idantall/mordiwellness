import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { ViewStyle } from 'react-native';

interface GridLayoutProps<T> {
  data: T[];
  renderItem: ({ item, index }: { item: T, index: number }) => JSX.Element;
  numColumns: number;
  itemSpacing?: number;
  containerStyle?: ViewStyle;
  itemStyle?: ViewStyle;
}

const GridLayout = <T,>({
  data,
  renderItem,
  numColumns,
  itemSpacing = 10,
  containerStyle,
  itemStyle,
}: GridLayoutProps<T>) => {
  const { width } = Dimensions.get('window');
  const itemSize = (width - (numColumns + 1) * itemSpacing) / numColumns;

  return (
    <View style={[styles.container, containerStyle]}>
      {data.map((item, index) => (
        <View
          key={index}
          style={[
            styles.item,
            itemStyle,
            {
              width: itemSize,
              height: itemSize,
              marginBottom: itemSpacing,
              marginRight: (index + 1) % numColumns === 0 ? 0 : itemSpacing,
            },
          ]}
        >
          {renderItem({ item, index })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  item: {
    justifyContent: "center",
    alignItems: 'center',
  },
});

export default GridLayout;
