import storage from '@react-native-firebase/storage';

export async function getGuideVideoUri(): Promise<string> {
    try {
        const storageRef = storage().ref("videos/example.mp4");
        const videoUri = await storageRef.getDownloadURL();
        return videoUri;
    } catch (err) {
        console.error("Error while fetching video url: ", err);
        throw err;
    }
}

