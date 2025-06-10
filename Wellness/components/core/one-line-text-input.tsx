import { useState } from 'react';
import { TextInput as RNTextInput, TextInputProps } from 'react-native';

interface TextInputFLProps extends TextInputProps {
    innerRef?: React.Ref<RNTextInput>;
    multiline?: boolean;
  }

// ! This is a work around for the problem with TextInput preventing ScrollView/FlatList from scrolling
// !!! NOT WORKING :(
const OneLineTextInput: React.FC<TextInputFLProps> = ({ multiline, innerRef, ...props }) => {

  const [isMultiline, setIsMultiline] = useState(false);

  return (
    <RNTextInput
      ref={innerRef}
      {...props}
      onTouchStart={() => setIsMultiline(true)}
      onTouchEnd={() => setIsMultiline(false)}
      onTouchCancel={() => setIsMultiline(false)}
      onTouchMove={() => setIsMultiline(false)}
      multiline={multiline || isMultiline}
    />
  );
}

export default OneLineTextInput;