import { Headphones, Radio } from 'lucide-react';

export default function Badge({ access, small = false }: { access: 'work' | 'listen'; small?: boolean }) {
  return (
    <span className={`badge ${access} ${small ? 'small' : ''}`}>
      {access === 'work' ? <Radio size={11} /> : <Headphones size={11} />}{' '}
      {access === 'work' ? 'Workable' : 'Receive only'}
    </span>
  );
}
