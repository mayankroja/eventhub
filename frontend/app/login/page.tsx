import { Suspense } from 'react';
import LoginForm from '../components/login-form';


export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-10">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}