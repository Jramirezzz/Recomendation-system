
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
            setError('Se deben ingresar exactamente 3 juegos');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/recomendar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ juegos }),
            });

            if (!response.ok) throw new Error('Error al obtener las recomendaciones');

            const data = await response.json();
            setRecomendaciones(data.recomendaciones || {});
            setError('');
        } catch (err) {
            setError('Hubo un error al obtener las recomendaciones.');
        }
    };

    const obtenerDetallesJuego = async (nombreJuego) => {
        setCargandoJuego(nombreJuego);
        try {
            const response = await fetch(`http://localhost:5000/juego/${nombreJuego}`);
            if (!response.ok) throw new Error('Error al obtener los detalles del juego');
    
            const data = await response.json();

            console.log('Detalles del juego:', data);
            const categorias = Object.entries(data)
                .filter(([key, value]) => generosColumns.includes(key) && value === true)
                .map(([key]) => key);
    
            setDetalleJuego({
                nombre: nombreJuego,
                categorias,
                año: data.year || 'Información no disponible',
                descripcion: data.plot || 'No se encontró una descripción para este juego.',
                rating: data.rating || 'Sin calificación',
            });
            setError('');
        } catch (err) {
            setError('Hubo un error al obtener los detalles del juego.');
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
