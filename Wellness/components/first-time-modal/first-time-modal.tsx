import React, { useState, useEffect } from 'react';
import { Modal, View } from 'react-native';
import IntroductionScreen from './introduction-modal';
import LifeCircleScreen from './life-circle-modal';
import VideoScreen from './video-modal';
import FirstGradeScreen from './first-grade-modal';
import { CategoryDocument } from 'types';
import { getGuideVideoUri } from '@/firebase-config/firebase-storage';
import Header from 'components/core/header';

interface FirstTimeModalProps {
    showModal: boolean;
    handleCloseModal: () => void;
    handleUpdateCategories: (updatedCategories: CategoryDocument[]) => Promise<void>;
    categories: CategoryDocument[];
}

const FirstTimeModal: React.FC<FirstTimeModalProps> = ({ showModal, categories, handleCloseModal, handleUpdateCategories }) => {
    const [modalStep, setModalStep] = useState<'introduction' | 'questions' | 'summary' | 'lifeCircle' | 'video'>('introduction');
    const [currentSelectedCategory, setCurrentSelectedCategory] = useState<number>(0);
    const [updatedCategories, setUpdatedCategories] = useState<CategoryDocument[]>([]);
    const [sliderValue, setSliderValue] = useState<number>(1);
    const [videoUri, setVideoUri] = useState<string|null>(null);


    const handleNextCategory = () => {
        if (currentSelectedCategory + 1 < categories.length) {
            setUpdatedCategories(prev => [...prev, { ...categories[currentSelectedCategory], grade: sliderValue }])
            setSliderValue(categories[currentSelectedCategory + 1].grade);
            setCurrentSelectedCategory(prev => ++prev);
        }
        else {
            setUpdatedCategories(prev => [...prev, { ...categories[currentSelectedCategory], grade: sliderValue }])
            setModalStep("video")
        }
    }


    useEffect(() => {
        console.log(updatedCategories);
    }, [updatedCategories]);

    useEffect(() => {
        async function fetchVideoUri() {
            if (modalStep === 'video') {
               try {
                const uri: string = await getGuideVideoUri();
                setVideoUri(uri);
               } catch (err) {
                throw err;
               }
            }
        }
        fetchVideoUri();
    }, [modalStep])

    return (
        <Modal transparent={true} animationType="fade" visible={showModal}>
            <Header showLogo={false} label='WELLNESS' showMenu={false} />
            <View className="flex-1 justify-center items-center bg-gradient-to-b from-blue-300 to-blue-500">
                {modalStep === 'introduction' && <IntroductionScreen onNext={() => setModalStep('questions')} />}
                {modalStep === "questions" && <FirstGradeScreen categories={categories} currentSelectedCategory={currentSelectedCategory} sliderValue={sliderValue} setSliderValue={setSliderValue} setUpdatedCategories={setUpdatedCategories} setCurrentSelectedCategory={setCurrentSelectedCategory} handleNextCategory={handleNextCategory} />}
                {modalStep === 'video' && (
                    <VideoScreen
                        videoUri={videoUri}
                        onNext={() => {
                            console.log(updatedCategories);
                            setModalStep('lifeCircle')
                        }}
                    />
                )}
                {modalStep === 'lifeCircle' && (
                    <LifeCircleScreen
                        onNext={async () => {
                            await handleUpdateCategories(updatedCategories);
                            handleCloseModal();
                        }}
                    />
                )}
            </View>
        </Modal>
    );
};

export default FirstTimeModal;
