// src/AppLayout/MainLayout.jsx
import Sidebar from './Dashboard/Components/Sidebar';
import TopBar from './Dashboard/Components/TopBar';

export default function MainLayout({ pageName, children, sidebarOpen, toggleSidebar }) {
  return (
    <div className="min-h-screen flex relative" style={{ background: '#F9FAFB' }}>
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? '220px' : '64px' }}
      >
        <TopBar pageName={pageName} toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
        {children}
      </div>
    </div>
  );
}
