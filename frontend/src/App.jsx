import { useState } from 'react';

const JuegoRecomendaciones = () => {
    const [juegos, setJuegos] = useState([]); 
    const [recomendaciones, setRecomendaciones] = useState({});  
    const [error, setError] = useState('');  
    const [detalleJuego, setDetalleJuego] = useState(null);  
    const [debugInfo, setDebugInfo] = useState('');  

    // Función para obtener las recomendaciones de juegos
    const obtenerRecomendaciones = async () => {
        // Verificar si se han ingresado exactamente 3 juegos
        if (juegos.length !== 3) {
            setError('Se deben ingresar exactamente 3 juegos');
            return;
        }

        try {
            // Usamos fetch en lugar de axios para hacer la solicitud POST
            const response = await fetch('http://localhost:5000/recomendar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ juegos }),
            });

            // Verificamos si la respuesta fue exitosa
            if (!response.ok) {
                throw new Error('Error al obtener las recomendaciones');
            }

            // Convertimos la respuesta en JSON
            const data = await response.json();

            // Depurar la respuesta
            console.log("Datos de recomendaciones recibidos:", data);

            // Verificar que la respuesta contiene los datos correctos
            if (data && typeof data === 'object') {
                setRecomendaciones(data);  // Almacenamos las recomendaciones en el estado
                setError('');  // Limpiamos cualquier error anterior
                setDebugInfo(JSON.stringify(data.debug, null, 2));  // Mostrar información de depuración
            } else {
                setError('La respuesta no contiene datos válidos');
            }
        } catch (err) {
            console.error('Hubo un error al obtener las recomendaciones:', err);
            setError('Hubo un error al obtener las recomendaciones.');
        }
    };

    // Función para obtener los detalles del juego seleccionado
    const obtenerDetallesJuego = async (nombreJuego) => {
        try {
            // Realizamos una consulta a la ruta /juego/<nombre> usando fetch
            const response = await fetch(`http://localhost:5000/juego/${nombreJuego}`);
            if (!response.ok) {
                throw new Error('Error al obtener los detalles del juego');
            }
            const data = await response.json();
            setDetalleJuego(data);  // Guardamos los detalles del juego en el estado
        } catch (err) {
            setError('Hubo un error al obtener los detalles del juego.');
        }
    };

    // Función para manejar el cambio de los inputs de los juegos
    const handleInputChange = (e, index) => {
        const newJuegos = [...juegos];
        newJuegos[index] = e.target.value;
        setJuegos(newJuegos);
    };

    return (
        <div>
            <h1>Recomendaciones de Juegos</h1>

            {/* Campos de entrada para los juegos */}
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

            {/* Mostrar errores si existen */}
            {error && <p>{error}</p>}

            {/* Mostrar las recomendaciones de juegos */}
            <h2>Recomendaciones y Similitudes:</h2>
            <div>
                {Object.keys(recomendaciones).length > 0 ? (
                    Object.keys(recomendaciones).map((metodo) => (
                        <div key={metodo}>
                            <h3>{metodo.toUpperCase()}</h3>
                            <ul>
                                {Array.isArray(recomendaciones[metodo]) && recomendaciones[metodo].length > 0 ? (
                                    recomendaciones[metodo].slice(0, 5).map((similitud, index) => (
                                        <li
                                            key={index}
                                            onClick={() => obtenerDetallesJuego(similitud.juego_similar)}  // Obtener detalles al hacer clic
                                        >
                                            {`Juego Similar: ${similitud.juego_similar}, Similitud: ${similitud.similitud}`}
                                        </li>
                                    ))
                                ) : (
                                    <p>No hay juegos recomendados para este método.</p>
                                )}
                            </ul>
                        </div>
                    ))
                ) : (
                    <p>No hay recomendaciones disponibles.</p>
                )}
            </div>

            {/* Mostrar los detalles del juego seleccionado */}
            {detalleJuego && (
                <div>
                    <h2>Detalles del Juego: {detalleJuego.name}</h2>
                    <p><strong>Géneros:</strong> {Object.keys(detalleJuego)
                        .filter((key) => key !== 'name' && key !== 'name_normalized')  // Filtrar la clave 'name' y 'name_normalized'
                        .map((genre, index) => detalleJuego[genre] ? genre : null)  // Mostrar solo los géneros con valor verdadero
                        .filter(Boolean)
                        .join(', ')}</p>
                    <p><strong>Descripción:</strong> {detalleJuego.description}</p>
                    <p><strong>Año de lanzamiento:</strong> {detalleJuego.release_year}</p>
                    <p><strong>Plataforma:</strong> {detalleJuego.platform}</p>
                    {/* Puedes agregar más detalles si lo deseas */}
                </div>
            )}

            {/* Mostrar la información de depuración */}
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
