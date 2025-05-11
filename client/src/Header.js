import { useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "./UserContext";

export default function Header() {
    const navigate = useNavigate();
    const {setUserInfo, userInfo} = useContext(UserContext);
    useEffect(() => {
        fetch('http://localhost:4000/profile', {
            credentials: 'include',
        }).then(response => {
            response.json().then(userInfo =>{
                setUserInfo(userInfo);
            });
        });
    }, []);

    function logout(){
        fetch('http://localhost:4000/logout', {
            credentials: 'include',
            method: 'POST',
        })
        setUserInfo(null);
        navigate('/login');
    }

    const username = userInfo?.username;

    return( 
        <header>
            <Link to="/" className="logo">The Digital Notebook</Link>
            <nav>
                {username && ( // If user logged in = "Home" & "Create new post" & "Logout"
                    <>
                    <span>Hello, {username}!</span>
                    <Link to="/">Home</Link>
                    <Link to="/create">Create</Link>
                    <a onClick={logout}>Logout</a> 
                    </> // Calls logout and clears userInfo
                )}
                {!username && ( // Otherwise, "Login" & "Register"
                    <>
                        <Link to="/login">Login</Link>
                        <Link to="/register">Register</Link>
                    </>
                )}
                
            </nav>
        </header>
    );
}