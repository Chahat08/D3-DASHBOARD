from flask import Flask, render_template, jsonify, request, session
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
import numpy as np
from sklearn.impute import SimpleImputer
from sklearn.cluster import KMeans

app = Flask(__name__)
app.secret_key = b'_5#y2L"F4Q8z\n\xec]/'

data = pd.read_csv("static/data/diabetes.csv")  
data.drop(columns=['Outcome'], inplace=True)

imputer = SimpleImputer(missing_values=np.nan, strategy='median')
processed_data = imputer.fit_transform(data)

scaler = StandardScaler()
processed_data = scaler.fit_transform(processed_data)

k=3
di=4

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/pca_data')
def get_pca_data():

    pca = PCA()
    pca.fit(processed_data)
    
    explained_variance_ratio = pca.explained_variance_ratio_
    explained_variance_cumsum = explained_variance_ratio.cumsum()
    
    chart_data = {
        "explained_variance_ratio": explained_variance_ratio.tolist(),
        "explained_variance_cumsum": explained_variance_cumsum.tolist()
    }
    
    return jsonify(chart_data)

@app.route('/biplot_data')
def biplot_data():
    global di, k

    pca = PCA()
    pca.fit(processed_data)
    
    pc_scores = pca.transform(processed_data)
    loadings = pca.components_
    
    kmeans = KMeans(n_clusters=k, random_state=0)
    clusters = kmeans.fit_predict(processed_data)
    
    biplot_data = {
        'scores': pc_scores.tolist(),
        'loadings': loadings.tolist(),
        'feature_names': data.columns.tolist(),
        'observation_names': data.index.tolist(),
        'clusters': clusters.tolist()
    }
    
    return jsonify(biplot_data)

@app.route('/elbow_plot_data')
def get_elbow_plot_data():
    distortions = []
    K_range = range(1, 11) 

    for k in K_range:
        kmeans = KMeans(n_clusters=k, random_state=0)
        kmeans.fit(processed_data)
        distortions.append(kmeans.inertia_)

    return jsonify({'K_range': list(K_range), 'distortions': distortions})
   

@app.route('/set_di', methods=['POST'])
def set_dimensionality_index():
    request_data = request.get_json()
    global di
    di = request_data['di']

    return jsonify({'message': 'Dimensionality index set successfully'})

@app.route('/get_top_attributes')
def get_top_attributes():
    global di, k

    pca = PCA(n_components=di)
    pca.fit(processed_data)

    loadings = pca.components_
    squared_sum_loadings = np.sum(loadings ** 2, axis=0)
    top_indices = np.argsort(squared_sum_loadings)[::-1][:4]

    top_attributes = [data.columns[i] for i in top_indices]
    top_loadings = list(squared_sum_loadings[top_indices])
    
    top_attribute_data = data[top_attributes]

    kmeans = KMeans(n_clusters=k, random_state=0)
    clusters = kmeans.fit_predict(top_attribute_data)

    top_attribute_data['cluster'] = clusters

    data_list = top_attribute_data.to_dict(orient='records')
    
    return jsonify({'top_attributes': top_attributes, 'top_loadings':top_loadings, 'data': data_list})


@app.route('/update_k', methods=['POST'])
def update_k():
    print(request.get_json())
    global k
    k = request.json.get('k')
    return jsonify({'success': True}), 200

if __name__ == '__main__':
    app.run(debug=True)
