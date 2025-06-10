import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';

interface NotificationModalProps {
  isVisible: boolean;
  onClose: () => void;
  notification: {
    title?: string;
    body?: string;
    data?: any;
  } | null;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ isVisible, onClose, notification }) => {
  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-gray-400">
        <View className="bg-white p-6 rounded-lg w-4/5 border-2 border-gray-100 shadow-lg">
          <Text className="text-xl font-bold mb-2 text-center">{notification?.title}</Text>
          <Text className="text-base mb-4">{notification?.body}</Text>
          <TouchableOpacity
            onPress={onClose}
            className="mt-2 py-2 px-4 rounded"
          >
            <Text className="text-blue-500 text-center">סגור</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default NotificationModal;
