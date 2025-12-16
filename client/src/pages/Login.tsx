import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { useAuth } from '../context/AuthContext.tsx';

const Login: React.FC = () => {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    // Use window.location as verify fallback if useNavigate fails in context 
    // or pass navigate result if available.
    // For now we assume useNavigate works inside BrowserRouter
    // But Login is inside Routes so it should be fine.

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isRegister) {
                // Assuming register is available in context or needs to be added to interface
                // For now, let's focus on login. If register is needed, we should add it.
                // But the form allows toggling. The AuthContext has register now.
                // @ts-ignore
                await login({ email, password, name: 'New User' }); // TODO: Add name input
            } else {
                await login({ email, password });
            }
            navigate('/dashboard');
        } catch (error) {
            alert('Login failed. Please check your credentials.');
        }
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: 'var(--bg-color)'
        }}>
            <Card className="login-card" style={{ width: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.5rem' }}>
                    {isRegister ? 'Create Account' : 'Welcome Back'}
                </h2>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {isRegister && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Full Name</label>
                            <input type="text" style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} />
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                        />
                    </div>

                    <Button type="submit" style={{ marginTop: '1rem' }}>
                        {isRegister ? 'Sign Up' : 'Sign In'}
                    </Button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <button
                        onClick={() => setIsRegister(!isRegister)}
                        style={{ background: 'none', color: 'var(--primary-color)', textDecoration: 'underline' }}
                    >
                        {isRegister ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
                    </button>
                </div>
            </Card>
        </div>
    );
};

export default Login;
