import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));

// NOTA: StrictMode removido temporariamente devido a bug com react-beautiful-dnd no React 18
// Ver: https://github.com/atlassian/react-beautiful-dnd/issues/2399
// Solução permanente: migrar para @hello-pangea/dnd
root.render(
  <App />
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
