Todo for now:

Make Logic for tab 0 on charts to display both goals and categories archieved grades

Google play -


| 5f:b8:60:66:08:f7:ad:80:da:8f:fa:eb:3d:2b:d7:d5:f1:95:81:d9:7e:b5:1d:9a:67:8b:ac:fa:e8:67:77:75 |
| ----------------------------------------------------------------------------------------------- |

| 43:15:dd:a8:14:bf:fd:e3:5b:fe:23:d9:13:46:c6:5f:7b:9c:45:97 |
| ----------------------------------------------------------- |

```tsx
import Tabs from 'components/tabs'
import { View } from 'react-native'
import { useState } from 'react'

export default function Tabs() {
    const [activeTab, setActiveTab] = useState<number>(0)
    const handleToggleTabs = (index: number) => setActiveTab(index);
    return (
        <View className="w-full h-full">
            <Tabs activeTab={activeTab} handleToggleTabs={handleToggleTabs} />
            {activeTab === 0 && (
                {/* Category chart here... */}
            )}
            {activeTab === 1 && (
                {/* Goals chart here... */}
            )}
        </View>
    )
}
```
