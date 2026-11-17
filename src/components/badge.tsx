import { Headphones, Radio, Wrench } from 'lucide-react';

type Access = 'work' | 'listen' | 'other';
const LABEL = { work: 'Workable', listen: 'Receive only', other: 'Other radio' };
export default function Badge({ access, small = false }: { access: Access; small?: boolean }) {
  return (
    <span className={`badge ${access} ${small ? 'small' : ''}`}>
      {access === 'work' ? (
        <Radio size={11} />
      ) : access === 'listen' ? (
        <Headphones size={11} />
      ) : (
        <Wrench size={11} />
      )}{' '}
      {LABEL[access]}
    </span>
  );
}
