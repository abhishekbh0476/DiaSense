import os
from dotenv import load_dotenv
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
from langchain_community.vectorstores import Chroma
from langchain.chains import ConversationalRetrievalChain
from langchain.prompts import PromptTemplate
from langchain.memory import ConversationBufferMemory
from langchain_groq import ChatGroq
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Load environment variables
load_dotenv()

def load_documents():
    """Load PDF documents from the Data directory"""
    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'Data')
    documents = []
    
    for file in os.listdir(data_dir):
        if file.endswith('.pdf'):
            pdf_path = os.path.join(data_dir, file)
            loader = PyPDFLoader(pdf_path)
            documents.extend(loader.load())
    
    return documents

def initialize_llm():
    """Initialize the Groq LLM with Llama model"""
    groq_api_key = os.getenv('GROQ_API_KEY')
    if not groq_api_key:
        raise ValueError("GROQ_API_KEY environment variable is not set")
    
    return ChatGroq(
        temperature=0,
        groq_api_key=groq_api_key,
        model_name="llama-3.3-70b-versatile"  
    )

def create_vector_db():
    """Create and persist the vector database from PDF documents"""
    # Load documents from the Data directory
    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'Data')
    loader = DirectoryLoader(data_dir, glob='*.pdf', loader_cls=PyPDFLoader)
    documents = loader.load()
    
    # Split documents into chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )
    texts = text_splitter.split_documents(documents)
    
    # Create embeddings
    embeddings = HuggingFaceEmbeddings(
        model_name='sentence-transformers/all-MiniLM-L6-v2',
        encode_kwargs={'normalize_embeddings': True}  # Enable normalization for better results
    )
    
    # Create and persist vector store
    vector_db = Chroma.from_documents(
        documents=texts,
        embedding=embeddings,
        persist_directory='./chroma_db'
    )
    vector_db.persist()
    
    return vector_db

def setup_qa_chain(vector_db, llm):
    """Set up the question-answering chain with custom prompt"""
    retriever = vector_db.as_retriever(search_kwargs={"k": 3})
    memory = ConversationBufferMemory(
        memory_key="chat_history",
        return_messages=True
    )
    
    # Define custom prompt template focused on diabetes
    prompt_template = """
    You are a specialized AI assistant focused on diabetes care and management. You provide accurate, empathetic, and helpful information about diabetes while maintaining a professional and supportive tone.

    Guidelines for responses:

    1. For General Diabetes Questions:
        - Provide clear, evidence-based information
        - Explain medical terms in simple language
        - Include both Type 1 and Type 2 diabetes perspectives when relevant

    2. For Symptom-Related Queries:
        - List common diabetes symptoms and their significance
        - Emphasize the importance of blood sugar monitoring
        - Suggest when to seek immediate medical attention

    3. For Treatment and Management:
        - Discuss various treatment options
        - Explain medication types and their roles
        - Emphasize the importance of regular medical check-ups
        - Provide lifestyle management tips

    4. For Diet and Exercise:
        - Offer diabetes-friendly meal suggestions
        - Explain carbohydrate counting and glycemic index
        - Recommend safe exercise options
        - Stress the importance of regular physical activity

    5. For Complications:
        - Explain potential complications
        - Discuss preventive measures
        - Emphasize the importance of regular monitoring

    Important Notice: Always remind users that while you provide information and support, you cannot replace professional medical advice. Encourage regular consultation with healthcare providers for personalized care.

    Context: {context}
    Chat History: {chat_history}
    Human Question: {question}

    Assistant Response: """
    
    PROMPT = PromptTemplate(
        template=prompt_template,
        input_variables=['context', 'chat_history', 'question']
    )
    
    qa_chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=retriever,
        memory=memory,
        combine_docs_chain_kwargs={"prompt": PROMPT}
    )
    
    return qa_chain

if __name__ == "__main__":
    print("Initializing the Diabetes Assistant...")
    llm = initialize_llm()
    
    # Check if vector database already exists
    db_path = "./chroma_db"
    print("Checking for existing vector database...")
    
    if os.path.exists(db_path) and os.listdir(db_path):
        print("Loading existing vector database...")
        embeddings = HuggingFaceEmbeddings(
            model_name='sentence-transformers/all-MiniLM-L6-v2',
            encode_kwargs={'normalize_embeddings': True}
        )
        vector_store = Chroma(persist_directory=db_path, embedding_function=embeddings)
    else:
        print("Creating new vector database...")
        vector_store = create_vector_db()
    
    print("Setting up QA chain...")
    qa_chain = setup_qa_chain(vector_store, llm)
    print("\nDiabetes Assistant is ready! Type 'quit' to exit.")
    
    while True:
        try:
            # Get user input
            query = input("\nYour question: ").strip()
            
            # Check for exit command
            if query.lower() in ['quit', 'exit', 'q']:
                print("Thank you for using the Diabetes Assistant!")
                break
            
            if not query:
                print("Please enter a question.")
                continue
            
            # Get response
            print("\nThinking...")
            result = qa_chain.run(query)
            print("\nAnswer:", result)
            
        except KeyboardInterrupt:
            print("\nThank you for using the Diabetes Assistant!")
            break
        except Exception as e:
            print(f"\nError: {str(e)}")
            print("Please try again or type 'quit' to exit.")