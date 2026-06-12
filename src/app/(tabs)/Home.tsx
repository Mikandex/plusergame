import { useAuthStore } from '@/store/AuthStore';
import UnAuthHomeScreen from '@/screens/home/UnAuthHomeScreen';
import AuthHomeScreen from '@/screens/home/AuthHomeScreen';

export default function Home() {
  
  const { isAuthenticated } = useAuthStore((state) => state);

  if (!isAuthenticated) {
    return (
      <UnAuthHomeScreen/>
    );
  }

  return (
    <AuthHomeScreen/>
  )
}