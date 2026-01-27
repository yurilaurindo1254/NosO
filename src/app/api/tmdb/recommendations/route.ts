import { NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const movieId = searchParams.get('movieId');
  const genreId = searchParams.get('genreId');
  const type = searchParams.get('type'); // 'movie' or 'tv' (default movie)

  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: 'TMDB API Key missing' }, { status: 500 });
  }

  try {
    let endpoint = '';
    const queryParams = new URLSearchParams({
      api_key: TMDB_API_KEY,
      language: 'pt-BR',
      page: '1',
      include_adult: 'false',
    });

    if (movieId) {
      // Recommendations based on a specific movie
      endpoint = `/movie/${movieId}/recommendations`;
    } else if (genreId) {
      // Discovery based on genre (Moods)
      endpoint = `/discover/movie`;
      queryParams.append('with_genres', genreId);
      queryParams.append('sort_by', 'popularity.desc');
      queryParams.append('vote_count.gte', '100'); // Ensure decent quality
    } else {
      return NextResponse.json({ error: 'Missing movieId or genreId' }, { status: 400 });
    }

    const res = await fetch(`${BASE_URL}${endpoint}?${queryParams.toString()}`);
    
    if (!res.ok) {
      throw new Error(`TMDB Error: ${res.status}`);
    }

    const data = await res.json();
    
    // Normalize data
    const results = data.results.map((item: any) => ({
      tmdb_id: item.id,
      title: item.title || item.name, // Handle movies and TV
      poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
      backdrop_path: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
      genre: "Gênero", // We'd need to map IDs to names, doing this client-side or skipping for now
      overview: item.overview,
      rating: item.vote_average,
      release_date: item.release_date || item.first_air_date,
    })).filter((m: any) => m.poster_path); // Filter out missing images

    return NextResponse.json(results);
    
  } catch (error: any) {
    console.error('TMDB API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
