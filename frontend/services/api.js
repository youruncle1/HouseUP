// services/api.js
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://147.229.183.155:3000', // Replace with your backend server address
});

export default api;
