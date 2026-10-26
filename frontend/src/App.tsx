import { BrowserRouter } from 'react-router-dom';
import { DemoAutoLogin } from '@/app/providers/DemoAutoLogin';
import { AppRoutes } from '@/app/router/AppRoutes';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <DemoAutoLogin />
      <AppRoutes />
    </BrowserRouter>
  );
}
