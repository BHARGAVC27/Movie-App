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
}

const client = new Client();
client.setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

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
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);
      console.log("Trending Movies:", movies);
    } catch (error) {
      console.error("Error fetching trending movies:", error);
    }
  }
  useEffect(() => {
    fetchMovies();
    fetchTrendingMovies();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchMovies(search);
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

        {
          trendingMovies.length > 0 && (
            <section className="trending">
              <h2 className="pb-10">Trending Movies</h2>
              <ul>
               {trendingMovies.map((movie,index) => {
                 return (
                   <li key={movie.$id}>
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
                height: "100vh",
              }}
            >
              <Lottie
                animationData={loadingAnimation}
                loop
                style={{ width: "200px", height: "200px" }}
              />
            </div>
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
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
