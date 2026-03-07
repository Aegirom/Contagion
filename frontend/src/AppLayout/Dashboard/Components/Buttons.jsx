import { Link } from 'react-router-dom';

const PlusButton = ({ text }) => (
  <Link
    to="/create-post"
    className="flex items-center gap-2 px-6 py-3 text-xs font-mono uppercase tracking-wider bg-toxic text-void border border-phantom rounded-lg transition-colors duration-200"
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
    {text}
  </Link>
);

export default PlusButton;
