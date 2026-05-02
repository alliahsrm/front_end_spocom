import React, { useState } from "react";
import "./SpoCom.css";

const SpoCom = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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

  const handleLogin = (e) => {
    e.preventDefault();
    if (user.username === "admin" && user.password === "123") {
      setIsLoggedIn(true);
    } else {
      alert("Invalid credentials");
    }
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

    const albumEntry = { 
      ...formData, 
      cover: autoCover,  
    };

    try {
    const response = await fetch("https://your-backend-api.com/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(albumEntry),
    });

    if (response.ok) {
      const savedData = await response.json();
      // Only update the UI if the database successfully saved the entry
      setAlbums([...albums, savedData]);
      closeModal();
    } else {
      alert("Failed to save to database");
    }
  } catch (error) {
    console.error("Connection Error:", error);
  }
};

  const openEdit = (album) => {
    setFormData({ 
      spotifyLink: album.spotifyLink,
      albumTitle: album.albumTitle, 
      artist: album.artist, 
      favSong: album.favSong,
      rating: album.rating, 
      comment: album.comment 
    });
    setEditingId(album.id);
    setShowModal(true);
  };

  const deleteAlbum = (id) => {
    setAlbums(albums.filter(a => a.id !== id));
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ spotifyLink: "", albumTitle: "", artist: "", favSong: "", rating: "", comment: "" });
  };

  if (!isLoggedIn) {
    return (
      <div className="app-outer-wrapper d-flex justify-content-center align-items-center bg-black">
        <div className="login-card border-white shadow-lg">
          <h4 className="text-white fw-black mb-4">ALBUM RECORD SYSTEM</h4>
          <form onSubmit={handleLogin} className="d-grid gap-2">
            <input type="text" placeholder="Username" className="form-control bg-dark text-white border-secondary" 
              onChange={(e) => setUser({...user, username: e.target.value})} />
            <input type="password" placeholder="Password" className="form-control bg-dark text-white border-secondary" 
              onChange={(e) => setUser({...user, password: e.target.value})} />
            <button className="btn btn-light fw-bold" type="submit">LOGIN</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-outer-wrapper d-flex justify-content-center align-items-center bg-black overflow-hidden">
      <div className="full-dashboard d-flex flex-column">
        <nav className="navbar navbar-dark bg-black px-4 border-bottom border-secondary w-100">
          <button className="btn btn-outline-light btn-sm fw-bold" onClick={() => setShowModal(true)}>+ ADD ALBUM</button>
          <span className="navbar-brand mx-auto fw-black h4 mb-0 text-white">ALBUM RECORD SYSTEM</span>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-danger btn-sm" onClick={() => setIsLoggedIn(false)}>LOGOUT</button>
          </div>
        </nav>

        <div className="row g-0 flex-grow-1 w-100 overflow-hidden">
         <main className="col-md-9 p-4 bg-black overflow-auto custom-scroll" style={{ maxHeight: '100%' }}>
        <div className="row row-cols-2 row-cols-lg-4 g-4">
              {albums.map((album) => (
                <div className="col" key={album.id}>
                  <div className="album-item bg-dark border border-secondary p-3 text-white text-center position-relative">
                    <div className="img-container position-relative mb-2">
                      <img src={album.cover} alt="cover" className="img-fluid grayscale" />
                      <div className="hover-overlay d-flex flex-column gap-2 justify-content-center align-items-center">
                        <button className="btn btn-sm btn-light fw-bold w-75" onClick={() => openEdit(album)}>EDIT</button>
                        <button className="btn btn-sm btn-danger fw-bold w-75" onClick={() => deleteAlbum(album.id)}>DEL</button>
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
              <p className="small text-secondary mb-0 uppercase">Average Score</p>
              <h1 className="fw-black text-white">
                {albums.length > 0 ? (albums.reduce((a, b) => a + Number(b.rating), 0) / albums.length).toFixed(1) : "0.0"}
              </h1>
            </div>
            <h6 className="fw-black border-bottom border-secondary pb-2 mb-3 uppercase">Recent Reviews</h6>
            <div className="reviews-scroll-area flex-grow-1 custom-scroll">
              {albums.map(a => (
                <div key={a.id} className="review-box mb-4 pb-3 border-bottom border-secondary">
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
            <h4 className="text-white mb-3 fw-black uppercase text-center">{editingId ? "Update" : "Add"}</h4>
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