import { useState } from 'react';
import './App.css';

const generosColumns = ['Action', 'Adventure', 'Comedy', 'Crime', 'Family', 'Fantasy', 'Mystery', 'Sci-Fi', 'Thriller'];

const JuegoRecomendaciones = () => {
    const [juegos, setJuegos] = useState([]); 
    const [recomendaciones, setRecomendaciones] = useState({});  
    const [error, setError] = useState('');  
    const [detalleJuego, setDetalleJuego] = useState(null);  
    const [debugInfo, setDebugInfo] = useState('');
    const [cargandoJuego, setCargandoJuego] = useState('');

    const obtenerRecomendaciones = async () => {
        if (juegos.length !== 3) {
            setError('Exactly 3 games must be entered');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/recomendar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ juegos }),
            });

            if (!response.ok) {
                throw new Error('Error getting recommendations');
            }

            const data = await response.json();
            console.log("Recommendation data received:", data);

            if (data && typeof data === 'object') {
                setRecomendaciones(data.recomendaciones);
                setError('');
                setDebugInfo(JSON.stringify(data.debug, null, 2));
            } else {
                setError('The response does not contain valid data');
            }
        } catch (err) {
            console.error('Error getting recommendations:', err);
            setError('There was an error getting the recommendations.');
        }
    };

    const obtenerDetallesJuego = async (nombreJuego) => {
        setCargandoJuego(nombreJuego);
        try {
            const response = await fetch(`http://localhost:5000/juego/${nombreJuego}`);
            if (!response.ok) {
                throw new Error('Error getting game details');
            }
            const data = await response.json();
            console.log('Game details received:', data);

            const categorias = Object.keys(data)
                .filter((key) => key !== 'name' && key !== 'name_normalized' && data[key])
                .map((key) => key);

            setDetalleJuego({
                nombre: nombreJuego,
                categorias,
                año: data.year || 'Information not available',
                descripcion: data.plot || 'No description found for this game.',
                rating: data.rating || 'No rating',
            });
            setError('');
        } catch (err) {
            console.error('Error getting game details:', err);
            setError('There was an error getting the game details.');
        } finally {
            setCargandoJuego('');
        }
    };

    const handleInputChange = (e, index) => {
        const newJuegos = [...juegos];
        newJuegos[index] = e.target.value;
        setJuegos(newJuegos);
    };

    const handleEnter = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            obtenerRecomendaciones();
        }
    };

    return (
        <section className='container'>
            <div className='forms' onKeyDown={handleEnter}>
                <h1>Next Game</h1>

                <div className='inputs'>
                    {Array.from({ length: 3 }, (_, index) => (
                        <input
                            type="text"
                            placeholder={`Game ${index + 1}`}
                            value={juegos[index] || ''}
                            onChange={(e) => handleInputChange(e, index)}
                            className='input'
                            key={index}
                            required="required"
                        />
                    ))}
                </div>
                
                <button className='button' onClick={obtenerRecomendaciones}>Get Recommendations</button>
            </div>

            {error && <p>{error}</p>}

            <div className='recomendaciones-section'>
                <h2>Recommendations and Similarities:</h2>
                <div className='recomendaciones'>
                    {Object.keys(recomendaciones).length > 0 ? (
                        Object.keys(recomendaciones).map((metodo) => (
                            <div key={metodo}>
                                <h3 className='titulo-metodo'>{metodo.toUpperCase()}</h3>
                                <div className='lista'>
                                    {Array.isArray(recomendaciones[metodo]) && recomendaciones[metodo].length > 0 ? (
                                        recomendaciones[metodo].slice(0, 5).map((similitud, index) => (
                                            <button className='item'
                                                key={index}
                                                onClick={() => obtenerDetallesJuego(similitud.juego_similar)}
                                            >
                                                <div className='item-juego'>{`${similitud.juego_similar}`}</div><div className='item-similitud'>{`Similarity: ${similitud.similitud}`}</div> 
                                            </button>
                                        ))
                                    ) : (
                                        <p>No recommended games for this method.</p>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No recommendations available.</p>
                    )}
                </div>
            </div>

            {cargandoJuego && <p>Loading details of {cargandoJuego}...</p>}
            {detalleJuego && (
                <div className='juego-info'>
                    <h3>{detalleJuego.nombre}</h3>
                    <div className='caracteristicas'>
                        <p><strong>Categories:</strong> {detalleJuego.categorias.join(', ') || 'No categories available'}</p>
                        <p><strong>Year:</strong> {detalleJuego.año}</p>
                        <p><strong>Description:</strong> {detalleJuego.descripcion}</p>
                        <p><strong>Rating:</strong> {detalleJuego.rating}</p>
                    </div>
                </div>
            )}
            <section className='footer'>
                <h3>About Recommendation Systems</h3>
                <p>
                    This recommendation system uses three different methods to suggest games based on your input:
                </p>
                <ul>
                    <li>
                        <strong>Cosine Similarity:</strong> Measures the cosine of the angle between two vectors, representing the similarity between them.
                    </li>
                    <li>
                        <strong>Euclidean Distance:</strong> Calculates the straight-line distance between two points in a multi-dimensional space.
                    </li>
                    <li>
                        <strong>Pearson Correlation:</strong> Measures the linear correlation between two sets of data, indicating how well they relate.
                    </li>
                </ul>
        </section>
        </section>
    );
};

export default JuegoRecomendaciones;
