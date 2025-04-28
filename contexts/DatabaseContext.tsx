import React, { createContext, useContext } from 'react';
import { usePlants as usePlantsInternal } from '@/hooks/usePlants';
import { usePlantHealth as usePlantHealthInternal } from '@/hooks/usePlantHealth';

/**
 * What the context will expose:
 *   • everything returned by usePlants()
 *   • a reference to the usePlantHealth hook
 */
type DatabaseContextValue = ReturnType<typeof usePlantsInternal> & {
	usePlantHealth: typeof usePlantHealthInternal;
};

const DatabaseCtx = createContext<DatabaseContextValue | null>(null);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	/* single source of truth for all plant-related data */
	const plantsValue = usePlantsInternal();

	const value: DatabaseContextValue = {
		...plantsValue,
		// we **don’t** call the hook – we just pass
		// the hook itself down so components can use it.
		usePlantHealth: usePlantHealthInternal,
	};

	return <DatabaseCtx.Provider value={value}>{children}</DatabaseCtx.Provider>;
};

/* ----- convenience hooks -------------------------------------------------- */

export const useDatabase = () => {
	const ctx = useContext(DatabaseCtx);
	if (!ctx) throw new Error('useDatabase must be used inside DatabaseProvider');
	return ctx;
};

/** Keeps existing code that calls `usePlants()` working unchanged. */
export const usePlants = () => useDatabase();

/**
 * Global version of the health hook:
 *   const { identifying, … } = usePlantHealth(plantId);
 * The rule-of-hooks is preserved because this function *is* a hook
 * (it starts with “use” and calls another hook unconditionally).
 */
export const usePlantHealth = (...args: Parameters<typeof usePlantHealthInternal>) => {
	const { usePlantHealth: healthHook } = useDatabase();
	return healthHook(...args);
};
