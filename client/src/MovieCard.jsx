import React from 'react'
import NoPoster from '../public/No-Poster.png'
export default function MovieCard({movie}) {
    
    return (
    <div className='movie-card'>
        <img
            src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : NoPoster}
            alt={movie.title || "No Poster"}
        />
react        <div className='mt-4'>
            <h3 className='text-sm'>{movie.title}</h3>
        </div>
        <div className='content'>
            <div className='rating'>
                <img src="./Rating.svg" alt="Rating" />
                <span className='text-gray-500'>{movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}</span>
            </div>
            <span>|</span>
            <span className='text-gray-500'>{movie.release_date ? movie.release_date.split('-')[0]: "N/A"}</span>

        </div>
    </div>
  )
}
