import React from 'react'
export default function Search({ search, setSearch }) {




  return (
    <div className='search mb-5'>
      <div>
        <img src="./search.svg" alt="Search" />
        <input type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search for Telugu movies..."
        />
      </div>
    </div>
  )
}
