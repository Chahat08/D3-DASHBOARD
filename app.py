# app.py (Flask application)
from flask import Flask, render_template, jsonify, request, session
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
import numpy as np
from sklearn.impute import SimpleImputer

app = Flask(__name__)
app.secret_key = b'_5#y2L"F4Q8z\n\xec]/'

data = pd.read_csv("static/data/diabetes.csv")  
data.drop(columns=['Outcome'], inplace=True)

imputer = SimpleImputer(missing_values=np.nan, strategy='median')
processed_data = imputer.fit_transform(data)

scaler = StandardScaler()
processed_data = scaler.fit_transform(processed_data)


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
   

@app.route('/set_di', methods=['POST'])
def set_dimensionality_index():
    request_data = request.get_json()
    di = request_data['di']
    session['dimensionality_index'] = di

    return jsonify({'message': 'Dimensionality index set successfully'})

@app.route('/get_top_attributes')
def get_top_attributes():
    di = session.get('dimensionality_index', None)
    if di is None:
        return jsonify({'error': 'Dimensionality index not set'})

    pca = PCA(n_components=di)
    pca.fit(processed_data)
    
    loadings = pca.components_
    squared_sum_loadings = np.sum(loadings**2, axis=0)
    top_indices = np.argsort(squared_sum_loadings)[::-1][:4]
    
    top_attributes = [data.columns[i] for i in top_indices]

    # Extract data corresponding to top attributes
    top_attribute_data = data[top_attributes].to_dict(orient='records')

    return jsonify({'top_attributes': top_attributes, 'data': top_attribute_data})


if __name__ == '__main__':
    app.run(debug=True)
