import React from "react";
import { View, Image } from "react-native"; // Make sure to import Text
import Svg, { Path, Circle, Text } from "react-native-svg";
import { MoodEmoji } from "@/types";

interface MoodMeterProps {
  currentMood: MoodEmoji;
}

function MoodMeter({ currentMood }: MoodMeterProps) {
  const angle = (currentMood.moodIndication / 100) * Math.PI;
  const x = 150 - 100 * Math.cos(angle);
  const y = 150 - 100 * Math.sin(angle);

  return (
    <View className="items-center" style={{ direction: 'ltr' }}>
      <Svg height="180" width="300" viewBox="0 0 300 180">
        {/* Background arc (border) */}
        <Path
          d="M30 150 A120 120 0 0 1 270 150"
          fill="none"
          stroke="#e0e0e0"
          strokeWidth="40"
        />

        {/* Colored arcs in the correct order */}
        <Path
          d="M30 150 A120 120 0 0 1 88 48"
          fill="none"
          stroke="#008000"
          strokeWidth="30"
        />
        <Path
          d="M88 48 A120 120 0 0 1 150 30"
          fill="none"
          stroke="#90EE90"
          strokeWidth="30"
        />
        <Path
          d="M150 30 A120 120 0 0 1 248 81"
          fill="none"
          stroke="#FFFF00"
          strokeWidth="30"
        />
        <Path
          d="M212 46 A120 120 0 0 1 269 140"
          fill="none"
          stroke="#FFA500"
          strokeWidth="30"
        />
        <Path
          d="M248 81 A120 120 0 0 1 270 150"
          fill="none"
          stroke="#FF0000"
          strokeWidth="30"
        />

        {/* Needle */}
        <Path d={`M150 150 L${x} ${y}`} stroke="black" strokeWidth="4" />
        <Circle
          cx="150"
          cy="150"
          r="10"
          fill="white"
          stroke="black"
          strokeWidth="2"
        />
      </Svg>

      {/* Check if currentMood.image is a valid icon name or text */}
      {typeof currentMood.image === "string" ? (
        <Image source={{ uri: currentMood.image }} className="w-16 h-16 absolute top-20" />
      ) : (
        <Text>{currentMood.image}</Text>
      )}
    </View>
  );
}

export default MoodMeter;
