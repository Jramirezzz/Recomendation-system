import { useState } from 'react';

const JuegoRecomendaciones = () => {
    const [juegos, setJuegos] = useState([]);
    const [recomendaciones, setRecomendaciones] = useState({});
    const [error, setError] = useState('');
    const [detalleJuego, setDetalleJuego] = useState(null);
    const [debugInfo, setDebugInfo] = useState('');
    const [cargandoDetalles, setCargandoDetalles] = useState(false);

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
            console.log("Datos de recomendaciones recibidos:", data);

            if (data && typeof data === 'object') {
                setRecomendaciones(data.recomendaciones);
                setError('');
                setDebugInfo(JSON.stringify(data.debug, null, 2));
            } else {
                setError('La respuesta no contiene datos válidos');
            }
        } catch (err) {
            console.error('Error al obtener las recomendaciones:', err);
            setError('Hubo un error al obtener las recomendaciones.');
        }
    };

    const obtenerDetallesJuego = async (nombreJuego) => {
    setCargandoDetalles(true);
    try {
        const response = await fetch(`http://localhost:5000/juego/${nombreJuego}`);
        if (!response.ok) throw new Error('Error al obtener los detalles del juego');

        const data = await response.json();

        // Filtrar las categorías con valor `true`.
        const categorias = Object.entries(data)
            .filter(([key, value]) => generosColumns.includes(key) && value === true)
            .map(([key]) => key);

        setDetalleJuego({
            categorias,
            año: data.year_of_release,
            descripcion: data.description,
            rating: data.rating,
        });
        setError('');
    } catch (err) {
        setError('Hubo un error al obtener los detalles del juego.');
    } finally {
        setCargandoDetalles(false);
    }
};

    const handleInputChange = (e, index) => {
        const newJuegos = [...juegos];
        newJuegos[index] = e.target.value;
        setJuegos(newJuegos);
    };

    return (
        <div>
            <h1>Recomendaciones de Juegos</h1>
            {Array.from({ length: 3 }, (_, index) => (
                <div key={index}>
                    <input
                        type="text"
                        placeholder={`Juego ${index + 1}`}
                        value={juegos[index] || ''}
                        onChange={(e) => handleInputChange(e, index)}
                    />
                </div>
            ))}
            <button onClick={obtenerRecomendaciones}>Obtener Recomendaciones</button>

            {error && <p>{error}</p>}

            <h2>Recomendaciones y Similitudes:</h2>
            <div>
                {Object.keys(recomendaciones).length > 0 ? (
                    Object.keys(recomendaciones).map((metodo) => (
                        <div key={metodo}>
                            <h3>{metodo.toUpperCase()}</h3>
                            <ul>
                                {recomendaciones[metodo].map((similitud, index) => (
                                    <li
                                        key={index}
                                        onClick={() => obtenerDetallesJuego(similitud.juego_similar)}
                                    >
                                        {`Juego Similar: ${similitud.juego_similar}, Similitud: ${similitud.similitud}`}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))
                ) : (
                    <p>No hay recomendaciones disponibles.</p>
                )}
            </div>

            {cargandoDetalles && <p>Cargando detalles del juego...</p>}
            {detalleJuego && (
                <div>
                    <h2>Detalles del Juego: {detalleJuego.name}</h2>
                    {Object.entries(detalleJuego).map(([key, value]) => (
                        key !== 'name' && (
                            <p key={key}>
                                <strong>{key}:</strong> {typeof value === 'boolean' ? (value ? 'Sí' : 'No') : value}
                            </p>
                        )
                    ))}
                </div>
            )}

            {debugInfo && (
                <div>
                    <h3>Información de Depuración:</h3>
                    <pre>{debugInfo}</pre>
                </div>
            )}
        </div>
    );
};

export default JuegoRecomendaciones;
