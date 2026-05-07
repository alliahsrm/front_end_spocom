import React, { useState, useEffect } from "react";
import "./SpoCom.css";

const SpoCom = () => {
  // Persistence: Restore user session from localStorage on component mount
  const [userId, setUserId] = useState(localStorage.getItem("userId") || null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("userId"));
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [user, setUser] = useState({ username: "", password: "" });
  const [albums, setAlbums] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({ 
    spotifyLink: "",
    albumTitle: "", 
    artist: "", 
    favSong: "",
    rating: "", 
    comment: "" 
  });

  // Updated to match your backend port
  const API_URL = "http://localhost:5000"; 

  // Fetch only the albums belonging to the specific logged-in userId
  useEffect(() => {
    if (isLoggedIn && userId) {
      fetch(`${API_URL}/api/albums/${userId}`)
        .then(res => res.json())
        .then(data => setAlbums(data))
        .catch(err => console.error("Fetch error:", err));
    }
  }, [isLoggedIn, userId]);

  // Combined function for Login and Registration
  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isSignUp ? "/api/register" : "/api/login";
    
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      const data = await response.json();

      if (data.success) {
        if (isSignUp) {
          alert("Account created! You can now login.");
          setIsSignUp(false); 
        } else {
          // Save the MongoDB _id to survive page reloads
          localStorage.setItem("userId", data.userId);
          setUserId(data.userId);
          setIsLoggedIn(true);
        }
      } else {
        alert(data.message || "Authentication failed");
      }
    } catch (err) {
      console.error("Auth error:", err);
      alert("Could not connect to the backend server.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    setUserId(null);
    setIsLoggedIn(false);
    setAlbums([]);
  };

  
  const saveAlbum = async () => {
    let autoCover = "https://via.placeholder.com/400/000000/FFFFFF?text=No+Cover+Found";

    if (formData.spotifyLink.includes("spotify.com")) {
      try {
        const albumId = formData.spotifyLink.split("album/")[1]?.split("?")[0];
        if (albumId) {
          const response = await fetch(`https://open.spotify.com/oembed?url=spotify:album:${albumId}`);
          const data = await response.json();
          if (data.thumbnail_url) autoCover = data.thumbnail_url;
        }
      } catch (error) {
        console.error("Spotify Fetch Error:", error);
      }
    }

    const albumEntry = { ...formData, cover: autoCover, userId: userId };

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${API_URL}/save/${editingId}` : `${API_URL}/save`;

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(albumEntry),
      });

      if (response.ok) {
        const savedAlbum = await response.json();
        if (editingId) {
          setAlbums(albums.map(a => a._id === editingId ? savedAlbum : a));
        } else {
          setAlbums([savedAlbum, ...albums]);
        }
        closeModal();
      }
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const deleteAlbum = async (mongoId) => {
    try {
      const response = await fetch(`${API_URL}/save/${mongoId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setAlbums(albums.filter(a => a._id !== mongoId));
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const openEdit = (album) => {
    setFormData({ ...album });
    setEditingId(album._id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ spotifyLink: "", albumTitle: "", artist: "", favSong: "", rating: "", comment: "" });
  };

  // Login/SignUp Card View
  if (!isLoggedIn) {
    return (
      <div className="app-outer-wrapper d-flex justify-content-center align-items-center bg-black">
        <div className="login-card border-white shadow-lg p-5 border">
          <h4 className="text-white fw-black mb-4 text-center">
            {isSignUp ? "CREATE ACCOUNT" : "ALBUM RECORD SYSTEM"}
          </h4>
          <form onSubmit={handleAuth} className="d-grid gap-3">
            <input 
              type="text" 
              placeholder="Username" 
              className="form-control bg-dark text-white border-secondary" 
              onChange={(e) => setUser({...user, username: e.target.value})} 
              required 
            />
            <input 
              type="password" 
              placeholder="Password" 
              className="form-control bg-dark text-white border-secondary" 
              onChange={(e) => setUser({...user, password: e.target.value})} 
              required 
            />
            <button className="btn btn-light fw-bold" type="submit">
              {isSignUp ? "REGISTER" : "LOGIN"}
            </button>
          </form>
          <p className="text-secondary mt-3 text-center small">
            {isSignUp ? "Already have an account?" : "New here?"}{" "}
            <span 
              className="text-white fw-bold" 
              style={{ cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? "Login" : "Sign Up"}
            </span>
          </p>
        </div>
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="app-outer-wrapper d-flex justify-content-center align-items-center bg-black overflow-hidden">
      <div className="full-dashboard d-flex flex-column">
        <nav className="navbar navbar-dark bg-black px-4 border-bottom border-secondary w-100">
          <button className="btn btn-outline-light btn-sm fw-bold" onClick={() => setShowModal(true)}>+ ADD ALBUM</button>
          <span className="navbar-brand mx-auto fw-black h4 mb-0 text-white text-uppercase">Album Record System</span>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>LOGOUT</button>
          </div>
        </nav>

        <div className="row g-0 flex-grow-1 w-100 overflow-hidden">
          <main className="col-md-9 p-4 bg-black overflow-auto custom-scroll" style={{ maxHeight: '100vh' }}>
            <div className="row row-cols-2 row-cols-lg-4 g-4">
              {albums.map((album) => (
                <div className="col" key={album._id}>
                  <div className="album-item bg-dark border border-secondary p-3 text-white text-center position-relative">
                    <div className="img-container position-relative mb-2">
                      <img src={album.cover} alt="cover" className="img-fluid grayscale" />
                      <div className="hover-overlay d-flex flex-column gap-2 justify-content-center align-items-center">
                        <button className="btn btn-sm btn-light fw-bold w-75" onClick={() => openEdit(album)}>EDIT</button>
                        <button className="btn btn-sm btn-danger fw-bold w-75" onClick={() => deleteAlbum(album._id)}>DEL</button>
                      </div>
                    </div>
                    <h6 className="mb-0 fw-bold text-truncate">{album.albumTitle}</h6>
                    <p className="small text-secondary mb-1">{album.artist}</p>
                    <p className="small text-white fw-bold">Rating: {album.rating}/10</p>
                  </div>
                </div>
              ))}
            </div>
          </main>
          
          <aside className="col-md-3 bg-black text-white p-4 border-start border-secondary overflow-auto custom-scroll">
            <div className="text-center mb-4">
              <p className="small text-secondary mb-0 text-uppercase">Average Score</p>
              <h1 className="fw-black text-white">
                {albums.length > 0 ? (albums.reduce((a, b) => a + Number(b.rating), 0) / albums.length).toFixed(1) : "0.0"}
              </h1>
            </div>
            <h6 className="fw-black border-bottom border-secondary pb-2 mb-3 text-uppercase">Recent Reviews</h6>
            <div className="reviews-scroll-area flex-grow-1 custom-scroll">
              {albums.map(a => (
                <div key={a._id} className="review-box mb-4 pb-3 border-bottom border-secondary">
                  <h6 className="fw-bold mb-1 text-uppercase text-white">{a.albumTitle}</h6>
                  <p className="small text-secondary mb-1">Favorite Track: <span className="text-white italic">{a.favSong}</span></p>
                  <p className="small lh-sm text-light font-serif">COMMENT: "{a.comment}"</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>

      {showModal && (
        <div className="custom-modal-overlay">
          <div className="custom-modal bg-dark border border-white p-4">
            <h4 className="text-white mb-3 fw-black text-uppercase text-center">{editingId ? "Update Album" : "Add New Album"}</h4>
            <input type="text" placeholder="Spotify Link" className="form-control mb-2 bg-black text-white border-secondary" 
              value={formData.spotifyLink} onChange={(e) => setFormData({...formData, spotifyLink: e.target.value})} />
            <input type="text" placeholder="Album Title" className="form-control mb-2 bg-black text-white border-secondary" 
              value={formData.albumTitle} onChange={(e) => setFormData({...formData, albumTitle: e.target.value})} />
            <input type="text" placeholder="Artist" className="form-control mb-2 bg-black text-white border-secondary" 
              value={formData.artist} onChange={(e) => setFormData({...formData, artist: e.target.value})} />
            <input type="text" placeholder="Fav Song" className="form-control mb-2 bg-black text-white border-secondary" 
              value={formData.favSong} onChange={(e) => setFormData({...formData, favSong: e.target.value})} />
            <input type="number" placeholder="Rating" className="form-control mb-2 bg-black text-white border-secondary" 
              value={formData.rating} onChange={(e) => setFormData({...formData, rating: e.target.value})} />
            <textarea placeholder="Review" className="form-control mb-3 bg-black text-white border-secondary" rows="3"
              value={formData.comment} onChange={(e) => setFormData({...formData, comment: e.target.value})}></textarea>
            <div className="d-flex gap-2">
              <button className="btn btn-light flex-grow-1 fw-bold" onClick={saveAlbum}>SAVE</button>
              <button className="btn btn-outline-secondary text-white" onClick={closeModal}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpoCom;