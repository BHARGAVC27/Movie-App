import React from "react";
import Search from "./Search.jsx";
import { useEffect, useState } from "react";
import MovieCard from "./MovieCard.jsx";
import Lottie from "lottie-react";
import loadingAnimation from "./loading.json";
import { Client } from "appwrite";
import { getTrendingMovies, updateSearchCount } from "./appwrite.js";

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;



let API_OPTIONS = null;
if (API_KEY) {
  API_OPTIONS = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
  };
} else {
  console.error("❌ TMDB API key is missing!");
}

const client = new Client();
try {
  client.setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);
  console.log("✅ Appwrite client initialized successfully");
} catch (error) {
  console.error("❌ Appwrite client initialization failed:", error);
}

export default function App() {
  const [search, setSearch] = React.useState("");
  const [movies, setMovies] = React.useState([]);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [trendingMovies, setTrendingMovies] = React.useState([]);
 
  const fetchMovies = async (searchQuery = "") => {
    setLoading(true);
    setErrorMessage("");
    setMovies([]);
    try {
      let endpoint;
      if (searchQuery.trim()) {
        setMovies([]);
        endpoint = `${API_BASE_URL}/search/movie?query=${encodeURIComponent(
          searchQuery
        )}&include_adult=false&language=en-US&page=1&region=IN`;
      } else {
        setMovies([]);
        endpoint = `${API_BASE_URL}/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc&with_original_language=te&region=IN`;
      }

      if (!API_OPTIONS) {
        setErrorMessage(
          "API key is not configured. Please add your TMDB API key to the .env file."
        );
        return;
      }

      const response = await fetch(endpoint, API_OPTIONS);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      if (data.Response === "False") {
        setErrorMessage(data.Error || "Failed to fetch movies");
        setMovies([]);
        return;
      }

      let filteredMovies = data.results;

      if (searchQuery.trim()) {
        filteredMovies = data.results
          .filter((movie) => {
            return (
              movie.original_language === "te" ||
              movie.title?.toLowerCase().includes("telugu") ||
              movie.overview?.toLowerCase().includes("telugu")
            );
          })
          .sort((a, b) => {
            const ratingDiff = (b.vote_average || 0) - (a.vote_average || 0);
            if (Math.abs(ratingDiff) > 0.5) return ratingDiff;

            const popularityDiff = (b.popularity || 0) - (a.popularity || 0);
            if (Math.abs(popularityDiff) > 10) return popularityDiff;

            return (b.vote_count || 0) - (a.vote_count || 0);
          });
      }
      setMovies(filteredMovies);
      setErrorMessage("");

      if (searchQuery.trim() && filteredMovies.length > 0) {
        await updateSearchCount(searchQuery, filteredMovies[0]);
      }
    } catch (error) {
      console.error("Error fetching movies:", error);
      setErrorMessage("Failed to fetch movies. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingMovies = async () => {
    try {
      console.log("🔄 Fetching trending movies...");
      const movies = await getTrendingMovies();
      console.log("✅ Trending movies fetched:", movies);
      setTrendingMovies(movies || []);
    } catch (error) {
      console.error("❌ Error fetching trending movies:", error);
      setTrendingMovies([]); // Set empty array on error
    }
  }

  useEffect(() => {
    console.log("🚀 App mounted, initializing...");
    try {
      fetchMovies();
      fetchTrendingMovies();
    } catch (error) {
      console.error("❌ Error in useEffect:", error);
      setLoading(false);
      setErrorMessage("Failed to initialize app. Please refresh the page.");
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        fetchMovies(search);
      } catch (error) {
        console.error("❌ Error in search effect:", error);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [search]);

  return (
    <main>
      <img src="./hero.png" alt="" />
      <div className="wrapper">
        <header>
          <h1>
            Find <span className="text-gradient">Movies</span> you love to watch <br /> <span className="tfi-gradient">TFI Edition</span>
          </h1>
          <Search search={search} setSearch={setSearch} />
        </header>

        {/* Debug info for deployment */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ color: 'white', padding: '10px', background: 'rgba(0,0,0,0.5)', margin: '10px 0' }}>
            <p>Debug Info:</p>
            <p>API Key: {API_KEY ? 'Present' : 'Missing'}</p>
            <p>Trending Movies Count: {trendingMovies.length}</p>
            <p>Movies Count: {movies.length}</p>
            <p>Loading: {loading.toString()}</p>
            <p>Error: {errorMessage || 'None'}</p>
          </div>
        )}

        {
          trendingMovies.length > 0 && !search.trim() && (
            <section className="trending">
              <h2 className="pb-10">Trending Movies</h2>
              <ul>
               {trendingMovies.map((movie,index) => {
                 return (
                   <li key={movie.$id || index}>
                      <p>{index+1}</p>
                      <img src={movie.poster_url || "/No-Poster.png"} alt={movie.searchTerm} loading="lazy" />
                   </li>
                 );
               })}
              </ul>
            </section>
          )
        }

        <section className="all-movies">
          <h2>Popular Movies </h2>
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                height: "50vh",
              }}
            >
              <Lottie
                animationData={loadingAnimation}
                loop
                style={{ width: "200px", height: "200px" }}
              />
            </div>
          ) : errorMessage ? (
            <div style={{ color: 'red', padding: '20px', textAlign: 'center' }}>
              <p>{errorMessage}</p>
              <button 
                onClick={() => window.location.reload()} 
                style={{ 
                  padding: '10px 20px', 
                  marginTop: '10px', 
                  backgroundColor: '#4190FF', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Reload Page
              </button>
            </div>
          ) : movies.length === 0 ? (
            <div style={{ color: 'white', textAlign: 'center', padding: '20px' }}>
              <p>No movies found. Try searching for something else.</p>
            </div>
          ) : (
            <ul>
              {movies.map((movie) => {
                return <MovieCard key={movie.id} movie={movie} />;
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
