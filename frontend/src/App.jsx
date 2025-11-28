import React from 'react'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import Header from './components/Header'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import Footer from './components/Footer'
import Home from './pages/Home'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/sign-in" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="grow">
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/sign-in' element={<SignIn />} />
            <Route path='/sign-up' element={<SignUp />} />
            <Route path='/dashboard' element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
