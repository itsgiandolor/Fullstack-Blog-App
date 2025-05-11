import { useEffect, useState } from "react";
import Post from "../Post";

export default function IndexPage() { // Sends a GET request that fetches all posts from /post
    const [posts,setPosts] = useState([]);
    useEffect(() => {
        fetch('http://localhost:4000/post').then(response => {
            response.json().then(posts => {
                setPosts(posts);
            });
        });
    }, []);
    return(
        <>
            {posts.length > 0 && posts.map(post => ( // Displays each post to a <Post /> component
                <Post {...post} />
            ))}
        </>
    );
}