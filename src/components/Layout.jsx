import Sidebar from './Sidebar';
import Header from './Header';
import Chatbot from './Chatbot';
import { IZIN } from '../data/mockData';

export default function Layout({ children, title }) {
    const pendingCount = IZIN.filter(i => i.status === 'Pending').length;

    return (
        <div className="layout">
            <Sidebar pendingCount={pendingCount} />
            <div className="layout-main">
                <Header title={title} />
                <main className="layout-content">
                    {children}
                </main>
            </div>
            {/* Chatbot floating — tampil di semua halaman */}
            <Chatbot />
        </div>
    );
}
