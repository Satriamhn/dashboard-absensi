import Sidebar from './Sidebar';
import Header from './Header';
import Chatbot from './Chatbot';

export default function Layout({ children, title }) {
    return (
        <div className="layout">
            <Sidebar />
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
