import api from "./api";

const register = (name, email, password, role, hourly_rate) => {
    return api.post("/auth/signup", {
        name,
        email,
        password,
        role,
        hourly_rate
    });
};

const login = (email, password) => {
    return api
        .post("/auth/signin", {
            email,
            password,
        })
        .then((response) => {
            if (response.data.accessToken) {
                localStorage.setItem("token", response.data.accessToken);
                localStorage.setItem("user", JSON.stringify(response.data));
            }
            return response.data;
        });
};

const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
};

const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem("user"));
};

const AuthService = {
    register,
    login,
    logout,
    getCurrentUser,
};

export default AuthService;
