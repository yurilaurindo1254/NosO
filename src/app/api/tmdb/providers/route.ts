import { NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const movieId = searchParams.get('movieId');

  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: 'TMDB API Key missing' }, { status: 500 });
  }

  if (!movieId) {
    return NextResponse.json({ error: 'Missing movieId' }, { status: 400 });
  }

  try {
    const res = await fetch(`${BASE_URL}/movie/${movieId}/watch/providers?api_key=${TMDB_API_KEY}`);
    
    if (!res.ok) {
      throw new Error(`TMDB Error: ${res.status}`);
    }

    const data = await res.json();
    
    // Get providers for Brazil (BR)
    const brProviders = data.results?.BR;

    if (!brProviders) {
      return NextResponse.json({ link: null, flatrate: [], rent: [], buy: [] });
    }

    // Helper to format provider data
    const formatProvider = (p: any) => ({
      provider_id: p.provider_id,
      provider_name: p.provider_name,
      logo_path: p.logo_path ? `https://image.tmdb.org/t/p/original${p.logo_path}` : null,
    });

    return NextResponse.json({
      link: brProviders.link, // JustWatch link
      flatrate: brProviders.flatrate?.map(formatProvider) || [],
      rent: brProviders.rent?.map(formatProvider) || [],
      buy: brProviders.buy?.map(formatProvider) || [],
    });
    
  } catch (error: any) {
    console.error('TMDB Providers Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
