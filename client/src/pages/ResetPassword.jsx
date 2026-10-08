import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAuth, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import UONLogo from '../images/UONLogo.png';
import '../styles/ResetPassword.css';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const oobCode = searchParams.get('oobCode');

    async function savePassword(event) {
        event.preventDefault();
        setError('');

        if (!oobCode) {
            setError('This password reset link is invalid or incomplete.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        try {
            setSaving(true);

            const auth = getAuth();

            // Confirm that the reset link is still valid.
            await verifyPasswordResetCode(auth, oobCode);

            // Save the new password in Firebase Authentication.
            await confirmPasswordReset(auth, oobCode, password);

            navigate('/login', {
                replace: true,
                state: {
                    passwordResetSuccess: true
                }
            });
        } catch (e) {
            if (e.code === 'auth/expired-action-code') {
                setError('This password reset link has expired. Please request a new one.');
            } else if (e.code === 'auth/invalid-action-code') {
                setError('This password reset link is invalid or has already been used.');
            } else if (e.code === 'auth/weak-password') {
                setError('Please choose a stronger password.');
            } else {
                setError('Unable to reset your password. Please request a new reset link.');
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="reset-password-page">
            <div className="reset-password-container">
                <img src={UONLogo} alt="University of Newcastle" className="reset-password-logo" />

                <h1>Reset Password</h1>
                <p>Create a new password for your WHS Reporting account.</p>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form onSubmit={savePassword}>
                    <div className="form-group">
                        <label htmlFor="new-password">Create password</label>
                        <input
                            id="new-password"
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirm-password">Rewrite password</label>
                        <input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="save-password-button"
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
