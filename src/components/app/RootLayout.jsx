import { Outlet } from 'react-router-dom';


const RootLayout = () => {

    return (
        <div className="app">
            <main className="main">
                <Outlet />
            </main>
        </div>
    );
};

export default RootLayout;
