import React, { useState } from 'react';

const ResetPasswordPage: React.FC = () => {
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const verifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        // Logic to verify OTP
        if (otp === '123456') { // Dummy check for example purposes
            setSuccessMessage('OTP verified! Now set your new password.');
            setErrorMessage('');
        } else {
            setErrorMessage('Invalid OTP. Please try again.');
            setSuccessMessage('');
        }
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        // Logic to reset password
        if (newPassword.length < 6) {
            setErrorMessage('Password must be at least 6 characters long.');
            return;
        }
        // Assume successful password reset
        setSuccessMessage('Your password has been reset successfully!');
        setErrorMessage('');
    };

    return (
        <div>
            <h1>Reset Password</h1>
            <form onSubmit={verifyOtp}>
                <div>
                    <label>
                        Enter OTP:
                        <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required />
                    </label>
                </div>
                <button type="submit">Verify OTP</button>
            </form>
            {successMessage && <p>{successMessage}</p>}
            {errorMessage && <p style={{color: 'red'}}>{errorMessage}</p>}
            {successMessage && (
                <form onSubmit={handlePasswordReset}>
                    <div>
                        <label>
                            New Password:
                            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                        </label>
                    </div>
                    <button type="submit">Reset Password</button>
                </form>
            )}
        </div>
    );
};

export default ResetPasswordPage;