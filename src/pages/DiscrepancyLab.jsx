import MockDiscrepancyLab from '@/pages/Academy/MockDiscrepancyLab';
import { useNavigate } from 'react-router-dom';

export default function DiscrepancyLabPage() {
  const navigate = useNavigate();
  return <MockDiscrepancyLab onBack={() => navigate(-1)} />;
}