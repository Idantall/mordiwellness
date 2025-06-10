import React from 'react';
import { Modal, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Easing,
  withSequence,
  runOnUI,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';

interface AnimationConfig {
  scale?: boolean;
  bounce?: boolean;
  slide?: boolean;
  fade?: boolean;
  rotate?: boolean;
  pop?: boolean;
  slideDirection?: 'top' | 'bottom' | 'left' | 'right';
}

interface AnimatedWindowProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  animationConfig?: AnimationConfig;
  showCloseArrow?: boolean; // New prop to control close arrow visibility
}

const AnimatedWindow: React.FC<AnimatedWindowProps> = ({
  visible,
  onClose,
  children,
  animationConfig = {},
  showCloseArrow = true, // Default value set to true
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(300);
  const translateX = useSharedValue(300);
  const rotate = useSharedValue(0);

  // Worklet function to determine slide animation
  const getSlideTransform = (isOpening: boolean) => {
    'worklet';
    const position = isOpening ? 0 : 300;
    switch (animationConfig.slideDirection) {
      case 'top':
        return { translateY: withTiming(isOpening ? 0 : -position, { duration: 300, easing: Easing.out(Easing.exp) }) };
      case 'bottom':
        return { translateY: withTiming(isOpening ? 0 : position, { duration: 300, easing: Easing.out(Easing.exp) }) };
      case 'left':
        return { translateX: withTiming(isOpening ? 0 : -position, { duration: 300, easing: Easing.out(Easing.exp) }) };
      case 'right':
        return { translateX: withTiming(isOpening ? 0 : position, { duration: 300, easing: Easing.out(Easing.exp) }) };
      default:
        return {};
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    const style: any = {};

    if (animationConfig.scale) {
      style.transform = [
        ...(style.transform || []),
        { scale: withSpring(visible ? 1 : 0.7, { damping: 15 }) },
      ];
    }

    if (animationConfig.bounce) {
      style.transform = [
        ...(style.transform || []),
        { scale: withSequence(
            withSpring(1.1, { damping: 10 }),
            withSpring(1)
          ) },
      ];
    }

    if (animationConfig.slide) {
      const slideTransform = getSlideTransform(visible);
      style.transform = [
        ...(style.transform || []),
        slideTransform
      ];
    }

    if (animationConfig.rotate) {
      style.transform = [
        ...(style.transform || []),
        { rotate: `${interpolate(rotate.value, [0, 1], [0, 360])}deg` },
      ];
    }

    if (animationConfig.pop) {
      style.transform = [
        ...(style.transform || []),
        { scale: withSpring(visible ? 1 : 0.5, { damping: 20 }) },
      ];
    }

    if (animationConfig.fade) {
      style.opacity = withTiming(visible ? 1 : 0, { duration: 200 });
    }

    return style;
  }, [visible, animationConfig]);

  React.useEffect(() => {
    runOnUI(() => {
      if (visible) {
        if (animationConfig.scale) scale.value = withSpring(1);
        if (animationConfig.rotate) rotate.value = withSequence(
          withSpring(360, { damping: 10 }),
          withSpring(0)
        );
        if (animationConfig.slide) {
          const slideTransform = getSlideTransform(true);
          if (slideTransform.translateX !== undefined) translateX.value = slideTransform.translateX;
          if (slideTransform.translateY !== undefined) translateY.value = slideTransform.translateY;
        }
        if (animationConfig.fade) opacity.value = withTiming(1, { duration: 200 });
        if (animationConfig.bounce) scale.value = withSequence(
          withSpring(1.1, { damping: 10 }),
          withSpring(1)
        );
      } else {
        // Ensure the closing animations are applied after the visible state is updated
        if (animationConfig.scale) scale.value = withTiming(0.7, { duration: 300 });
        if (animationConfig.rotate) rotate.value = withTiming(0, { duration: 300 });
        if (animationConfig.slide) {
          const slideTransform = getSlideTransform(false);
          if (slideTransform.translateX !== undefined) translateX.value = slideTransform.translateX;
          if (slideTransform.translateY !== undefined) translateY.value = slideTransform.translateY;
        }
        if (animationConfig.fade) opacity.value = withTiming(0, { duration: 200 });
        if (animationConfig.bounce) scale.value = withTiming(0.7, { duration: 300 });
      }
    });
  }, [visible, scale, opacity, translateY, rotate, translateX, animationConfig]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }, animatedStyle]}
      >
        {showCloseArrow && (
          <Pressable
            onPress={onClose}
            style={{
              position: 'absolute',
              top: 20,
              left: 20,
              backgroundColor: 'transparent',
              padding: 10,
              zIndex: 40
            }}
          >
            <Icon name="arrow-back" size={30} color="blue" />
          </Pressable>
        )}
        {children}
      </Animated.View>
    </Modal>
  );
};

export default AnimatedWindow;
