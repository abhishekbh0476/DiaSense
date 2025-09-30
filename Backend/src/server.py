from flask import Flask, request, jsonify
from flask_cors import CORS
from main import initialize_llm, setup_qa_chain, create_vector_db
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
import os
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configure CORS to allow requests from frontend
CORS(app, 
     origins=["http://localhost:3000", "http://127.0.0.1:3000"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"],
     supports_credentials=True)

# Initialize global variables
qa_chain = None
vector_db = None

def init_app():
    """Initialize the application components"""
    global qa_chain, vector_db
    
    logger.info("Initializing Diabetes Assistant...")
    try:
        llm = initialize_llm()
        db_path = "./chroma_db"
        
        if not os.path.exists(db_path) or not os.listdir(db_path):
            logger.info("Creating new vector database...")
            vector_db = create_vector_db()
        else:
            logger.info("Loading existing vector database...")
            embeddings = HuggingFaceEmbeddings(model_name='sentence-transformers/all-MiniLM-L6-v2')
            vector_db = Chroma(persist_directory=db_path, embedding_function=embeddings)
        
        qa_chain = setup_qa_chain(vector_db, llm)
        logger.info("Diabetes Assistant initialized successfully!")
    except Exception as e:
        logger.error(f"Error initializing Diabetes Assistant: {str(e)}")
        raise

@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle chat requests"""
    try:
        logger.info("=" * 50)
        logger.info("🔥 BACKEND: Chat request received")
        logger.info(f"📨 Request headers: {dict(request.headers)}")
        logger.info(f"📨 Request method: {request.method}")
        logger.info(f"📨 Request URL: {request.url}")
        logger.info(f"📨 Request data: {request.get_data(as_text=True)}")
        
        if not request.is_json:
            logger.error("❌ Request is not JSON")
            return jsonify({
                'error': 'Content-Type must be application/json',
                'status': 'error'
            }), 400

        data = request.json
        logger.info(f"📋 Parsed JSON data: {data}")
        
        query = data.get('message')
        logger.info(f"💬 Extracted message: {query}")
        
        if not query:
            logger.error("No message provided in request")
            return jsonify({
                'error': 'No message provided in request body',
                'status': 'error'
            }), 400
        
        logger.info(f"Processing query: {query}")
        
        # Get response from the chatbot
        logger.info("🤖 Calling AI model...")
        result = qa_chain({"question": query})
        logger.info(f"🤖 AI response received: {result['answer'][:100]}...")
        
        # Format response for frontend
        formatted_response = {
            'response': result['answer'],
            'status': 'success',
            'metadata': {
                'timestamp': datetime.now().isoformat(),
                'query_processed': query,
                'response_type': 'text',
                'sources': [doc.metadata for doc in result.get('source_documents', [])]
            }
        }
        
        logger.info("✅ Generated response successfully")
        logger.info(f"📤 Sending response: {formatted_response}")
        logger.info("=" * 50)
        
        return jsonify(formatted_response)

    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}", exc_info=True)
        return jsonify({
            'error': str(e),
            'status': 'error',
            'details': 'An unexpected error occurred while processing your request',
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'cors': 'enabled'
    })

@app.route('/test-cors', methods=['GET', 'POST', 'OPTIONS'])
def test_cors():
    """Test CORS configuration"""
    return jsonify({
        'message': 'CORS is working!',
        'method': request.method,
        'origin': request.headers.get('Origin'),
        'timestamp': datetime.now().isoformat()
    })

# Initialize the application
init_app()

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    logger.info(f"Starting Diabetes Assistant on port: {port}")
    logger.info("Available endpoints:")
    logger.info(" * /api/chat [POST]")
    logger.info(" * /health [GET]")
    logger.info(" * /test-cors [GET, POST, OPTIONS]")
    
    app.run(debug=True, host='0.0.0.0', port=port)