import { Outlet } from 'react-router-dom';


const RootLayout = () => {

    return (
        <div className="app">
            <main className="main">
                <div className='container-desk'>
                    <Outlet />
                </div>

            </main>
        </div>
    );
};

export default RootLayout;
