import React from 'react'
import Search from './Search.jsx';
import { useEffect, useState } from 'react'
import MovieCard from './MovieCard.jsx';
import Lottie from "lottie-react";
import loadingAnimation from './loading.json';
import { Client } from 'appwrite';

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

let API_OPTIONS = null;
if (API_KEY) {
  API_OPTIONS = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    }
  }
}


const client = new Client();
client.setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export default function App() {
  const [search, setSearch] = React.useState("");
  const [movies, setMovies] = React.useState([]);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [loading, setLoading] = React.useState(true);



  const fetchMovies = async (searchQuery = "") => {
    setLoading(true);
    setErrorMessage("");
    setMovies([]);
    try {
      let endpoint;
      if (searchQuery.trim()) {
        setMovies([]);
        endpoint = `${API_BASE_URL}/search/movie?query=${encodeURIComponent(searchQuery)}&include_adult=false&language=en-US&page=1&&with_original_language=te&&sort_by=popularity.desc`;
      } else {
        setMovies([]);
        endpoint = `${API_BASE_URL}/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc&with_original_language=te`;
      }

      if (!API_OPTIONS) {
        setErrorMessage('API key is not configured. Please add your TMDB API key to the .env file.');
        return;
      }

      const response = await fetch(endpoint, API_OPTIONS);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      if (data.Response === "False") {
        setErrorMessage(data.Error || "Failed to fetch movies");
        setMovies([]);
        return;
      }
      setMovies(data.results);
      setErrorMessage("");
    } catch (error) {
      console.error('Error fetching movies:', error);
      setErrorMessage('Failed to fetch movies. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMovies();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchMovies(search);
    }, 500); // Debounce search by 500ms

    return () => clearTimeout(timeoutId);
  }, [search]);

  return (
    <main>
      
      <img src="./hero.png" alt="" />
      <div className='wrapper'>
        <header>
          <h1>Find <span className='text-gradient'>Movies</span> you love to watch</h1>
          <Search search={search} setSearch={setSearch} />
        </header>

        <section className='all-movies'>
          <h2>All Movies </h2>
          {loading ? (
            <div style={{
              display: "flex",
              justifyContent: "center",
              height: "100vh"
            }}>
              <Lottie
                animationData={loadingAnimation}
                loop
                style={{ width: "200px", height: "200px" }}
              />
            </div>
          ) : errorMessage ? (
            <p className='text-red-500'>{errorMessage}</p>
          ) : (
            <ul>
              {movies.map((movie) => {
                return <MovieCard key={movie.id} movie={movie} />
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
