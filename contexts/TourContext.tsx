import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type TourStep = 'add-plant' | 'schedule' | 'complete';

type TourContextType = {
	currentStep: TourStep | null;
	setCurrentStep: (step: TourStep | null) => void;
	isFirstTime: boolean;
	completeTour: () => void;
};

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: React.ReactNode }) {
	const [currentStep, setCurrentStep] = useState<TourStep | null>(null);
	const [isFirstTime, setIsFirstTime] = useState(true);

	useEffect(() => {
		checkFirstTime();
	}, []);

	const checkFirstTime = async () => {
		try {
			const hasCompletedTour = await AsyncStorage.getItem('@tour_completed');
			setIsFirstTime(!hasCompletedTour);
			if (!hasCompletedTour) {
				setCurrentStep('add-plant');
			}
		} catch (error) {
			console.error('Error checking tour status:', error);
		}
	};

	const completeTour = async () => {
		try {
			await AsyncStorage.setItem('@tour_completed432423', 'true');
			setIsFirstTime(false);
			setCurrentStep(null);
		} catch (error) {
			console.error('Error completing tour:', error);
		}
	};

	return (
		<TourContext.Provider value={{ currentStep, setCurrentStep, isFirstTime, completeTour }}>
			{children}
		</TourContext.Provider>
	);
}

export function useTour() {
	const context = useContext(TourContext);
	if (context === undefined) {
		throw new Error('useTour must be used within a TourProvider');
	}
	return context;
}
