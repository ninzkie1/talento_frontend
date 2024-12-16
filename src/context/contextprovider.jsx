import { createContext, useContext, useState, useEffect } from "react";

const stateContext = createContext({
    user: null,
    token: null,
    setUser: () => {},
    setToken: () => {},
});

export const ContextProvider = ({ children }) => {
    const [user, setUserState] = useState(JSON.parse(localStorage.getItem('USER_DATA')) || null);
    const [token, _setToken] = useState(localStorage.getItem('ACCESS_TOKEN'));

    const setUser = (user) => {
        setUserState(user);
        if (user) {
            localStorage.setItem('USER_DATA', JSON.stringify(user));
        } else {
            localStorage.removeItem('USER_DATA');
        }
    }

    const setToken = (token) => {
        _setToken(token);
        if (token) {
            localStorage.setItem('ACCESS_TOKEN', token);
        } else {
            localStorage.removeItem('ACCESS_TOKEN');
        }
    }

    return (
        <stateContext.Provider value={{
            user,
            token,
            setUser,
            setToken
        }}>
            {children}
        </stateContext.Provider>
    )
}

export const useStateContext = () => useContext(stateContext);