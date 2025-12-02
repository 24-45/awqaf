from flask import Flask, render_template, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/data')
def get_data():
    # Placeholder for Python data processing
    # In the future, this can read from the 'data' directory or a database
    sample_data = {
        "awareness_level": 75,
        "region": "Gulf",
        "message": "Data served from Python backend"
    }
    return jsonify(sample_data)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
