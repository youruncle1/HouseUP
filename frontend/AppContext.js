/**
 * @file AppContext.js
 * @brief Provides a global application state management like current user and current household using React Context API.
 * @author Denis Milistenfer <xmilis00@stud.fit.vutbr.cz>
 * @date 12.12.2024
 */
import React, { createContext, useState, useContext } from 'react';

// Create the Context
const AppContext = createContext();

// Create a Provider component
export function AppProvider({ children }) {
    const [currentUser, setCurrentUser] = useState({
        id: 'user2@gmail.com',
        name: 'Roman',
        profileImage: 'https://images.rawpixel.com/image_png_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIyLTA4L2pvYjEwMzQtZWxlbWVudC0wNi0zOTcucG5n.png',
    });
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