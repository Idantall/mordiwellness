import "./global.css";
import { View, SafeAreaView, I18nManager } from 'react-native';
import { Slot, SplashScreen } from "expo-router";
import Toast from 'react-native-toast-message';
import { UserProvider } from '@/context/user-context';
import ConfiguredQueryClientProvider from '@/modules/module-react-query';

I18nManager.forceRTL(false);
I18nManager.allowRTL(false);

SplashScreen.preventAutoHideAsync();

export default function Layout() {
  return (
    <ConfiguredQueryClientProvider>
      <UserProvider>
        <SafeAreaView className='flex-1'>
          <Toast position='top' />
          <View className='flex-1'>
            <Slot />
          </View>
        </SafeAreaView>
      </UserProvider>
    </ConfiguredQueryClientProvider>
  );
}
