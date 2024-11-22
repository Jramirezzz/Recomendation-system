from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity, euclidean_distances
from sklearn.preprocessing import StandardScaler
from scipy.spatial.distance import correlation
import difflib

app = Flask(__name__)

# Habilitar CORS para permitir solicitudes desde cualquier origen
CORS(app, resources={r"/*": {"origins": "*"}})  # Permitir todos los orígenes

# Cargar los datos de la base de datos inicial
df = pd.read_csv("imdb-videogames.csv")
df['name_normalized'] = df['name'].str.lower().str.strip()

# Definir las columnas de géneros que vamos a usar
generos_columns = ['Action', 'Adventure', 'Comedy', 'Crime', 'Family', 'Fantasy', 'Mystery', 'Sci-Fi', 'Thriller']

# Convertir géneros a valores booleanos
for col in generos_columns:
    df[col] = df[col].astype(bool)

# Normalizar las características de los juegos
scaler = StandardScaler()
caracteristicas_normalizadas = scaler.fit_transform(df[generos_columns])

# Función para obtener el título más similar de forma automática
def obtener_titulo_sugerido(titulo_ingresado, lista_titulos, cutoff=0.4):
    titulos_similares = difflib.get_close_matches(titulo_ingresado.lower(), lista_titulos, n=5, cutoff=cutoff)
    if titulos_similares:
        return [titulos_similares[0]]
    else:
        return []

# Función para calcular la similitud utilizando diferentes métodos
def calcular_similitud(metodo, caracteristicas_recomendadas, caracteristicas_normalizadas):
    if metodo == 'coseno':
        return cosine_similarity(caracteristicas_recomendadas, caracteristicas_normalizadas)
    elif metodo == 'pearson':
        similitudes_pearson = []
        for i in range(len(caracteristicas_recomendadas)):
            similitudes_pearson.append([1 - correlation(caracteristicas_recomendadas[i], row) for row in caracteristicas_normalizadas])
        return np.array(similitudes_pearson)
    elif metodo == 'euclidea':
        return 1 / (1 + euclidean_distances(caracteristicas_recomendadas, caracteristicas_normalizadas))  # Normalizar a [0,1]

# Procesar las recomendaciones y generar resultados detallados para los tres métodos
def procesar_recomendaciones(juegos_recomendados):
    # Obtener las características de los 3 juegos recomendados
    juegos_filtrados = df[df['name_normalized'].isin(juegos_recomendados)]
    caracteristicas_recomendadas = juegos_filtrados[generos_columns]

    # Calcular el perfil combinado de los juegos recomendados (promediar las características)
    perfil_combinado = caracteristicas_recomendadas.mean(axis=0).values.reshape(1, -1)
    
    # Normalizar el perfil combinado
    perfil_combinado_normalizado = scaler.transform(perfil_combinado)

    # Crear un diccionario para almacenar las recomendaciones de cada método
    recomendaciones = {}

    # Calcular las similitudes usando los tres métodos y almacenar las recomendaciones
    for metodo in ['coseno', 'pearson', 'euclidea']:
        similitudes = calcular_similitud(metodo, perfil_combinado_normalizado, caracteristicas_normalizadas)

        # Sugerir los 3 juegos más similares al perfil combinado
        indices_similares = np.argsort(similitudes[0])[::-1][1:4]  # Tomar los 3 más similares

        recomendaciones_metodo = []
        for idx in indices_similares:
            recomendaciones_metodo.append({
                "juego_similar": df.iloc[idx]['name'],
                "similitud": round(similitudes[0][idx], 3),
                "generos": df.iloc[idx][generos_columns].to_dict()
            })

        # Agregar las recomendaciones al diccionario de resultados
        recomendaciones[metodo] = recomendaciones_metodo

    return recomendaciones

@app.route('/recomendar', methods=['POST'])
def recomendar():
    data = request.json
    juegos = data.get('juegos', [])

    if len(juegos) != 3:
        return jsonify({"error": "Se deben ingresar exactamente 3 juegos."}), 400

    # Obtener títulos sugeridos y filtrar
    recomendaciones = []
    for juego in juegos:
        titulos_encontrados = obtener_titulo_sugerido(juego, df['name_normalized'])
        if titulos_encontrados:
            recomendaciones.append(titulos_encontrados[0])

    if len(recomendaciones) < 3:
        return jsonify({"error": "No se encontraron coincidencias suficientes."}), 400

    # Procesar las recomendaciones y similitudes para los tres métodos
    recomendaciones_resultado = procesar_recomendaciones(recomendaciones)

    # Enviar los resultados como respuesta JSON
    return jsonify({"recomendaciones": recomendaciones_resultado})

if __name__ == '__main__':
    app.run(debug=True)
