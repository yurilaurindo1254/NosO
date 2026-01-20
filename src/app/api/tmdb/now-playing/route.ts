import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.TMDB_API_KEY;
  const token = process.env.TMDB_READ_TOKEN;

  if (!apiKey && !token) {
    console.error("❌ TMDB API Keys missing! Make sure to restart the server after editing .env.local");
    return NextResponse.json({ error: 'API Key missing. Restart server.' }, { status: 500 });
  }

  try {
    const res = await fetch(
      'https://api.themoviedb.org/3/movie/now_playing?language=pt-BR&region=BR&page=1',
      {
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${token}`
        },
        next: { revalidate: 3600 } // Cache por 1 hora
      }
    );

    if (!res.ok) throw new Error('Falha ao buscar filmes');

    const data = await res.json();
    
    // Mapear gêneros (A TMDB usa IDs)
    const genreMap: Record<number, string> = {
      28: "Ação", 12: "Aventura", 16: "Animação", 35: "Comédia",
      80: "Crime", 99: "Documentário", 18: "Drama", 10751: "Família",
      14: "Fantasia", 36: "História", 27: "Terror", 10402: "Música",
      9648: "Mistério", 10749: "Romance", 878: "Ficção", 10770: "TV Movie",
      53: "Thriller", 10752: "Guerra", 37: "Faroeste"
    };

    const movies = data.results.map((m: any) => ({
      tmdb_id: m.id,
      title: m.title,
      overview: m.overview,
      release_date: m.release_date,
      poster_path: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
      backdrop_path: m.backdrop_path ? `https://image.tmdb.org/t/p/w780${m.backdrop_path}` : null,
      genre: m.genre_ids[0] ? genreMap[m.genre_ids[0]] : 'Outros',
      rating: m.vote_average
    }));

    return NextResponse.json(movies);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao conectar com TMDB' }, { status: 500 });
  }
}
