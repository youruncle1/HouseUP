import React, { createContext, useState, useContext } from 'react';

// Create the Context
const AppContext = createContext();

// Create a Provider component
export function AppProvider({ children }) {
    const [currentUser, setCurrentUser] = useState({ id: 'user2@gmail.com', name: 'Roman' });
    const [currentHousehold, setCurrentHousehold] = useState({ id: 'household1', name: 'Household1' });
    const [showUserImages, setShowUserImages] = useState(true);
    const [hideCheckedItems, setHideCheckedItems] = useState(false);

    return (
        <AppContext.Provider
            value={{
                currentUser,
                setCurrentUser,
                currentHousehold,
                setCurrentHousehold,
                showUserImages,
                setShowUserImages,
                hideCheckedItems,
                setHideCheckedItems
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

// Custom Hook to Use the Context
export function useAppContext() {
    return useContext(AppContext);
}

