import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const triggerVerification = async () => {
      try {
        const response = await api.get(`/auth/verify-email/${token}/`);
        if (response.data.success) {
          navigate('/email-verified');
        } else {
          navigate('/email-expired');
        }
      } catch (error) {
        console.error("Verification failed:", error);
        navigate('/email-expired');
      }
    };

    if (token) {
      triggerVerification();
    }
  }, [token, navigate]);

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <LoadingSpinner size="lg" />
      <h2 className="text-xl font-semibold mt-6 text-slate-800 dark:text-white">Verifying your email...</h2>
      <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Please wait while we validate your activation link.</p>
    </div>
  );
}
