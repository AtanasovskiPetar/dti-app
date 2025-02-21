from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from tdc.multi_pred import DTI
import numpy as np
import joblib
import os
from fastapi.middleware.cors import CORSMiddleware
from rdkit import Chem
from rdkit.Chem import AllChem
from Bio.SeqUtils.ProtParam import ProteinAnalysis

try:
    dti_large = DTI(name='bindingdb_ic50')
    dti_large.harmonize_affinities(mode='max_affinity')
    df = dti_large.get_data()
except Exception as e:
    df = None
    print(f"Warning: Failed to load dataset - {e}")

MODEL_PATH = "random_forest_model.pkl"
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model file {MODEL_PATH} not found!")

model = joblib.load(MODEL_PATH)

def smiles_to_fingerprint(smiles, radius=2, n_bits=1024):
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return None
    return AllChem.GetMorganFingerprintAsBitVect(mol, radius, n_bits)

def fasta_to_features(fasta):
    try:
        analysis = ProteinAnalysis(fasta)
        aa_composition = analysis.get_amino_acids_percent()
        return list(aa_composition.values())
    except:
        return None

def predict_affinity(smiles, fasta):
    mol = Chem.MolFromSmiles(smiles)
    isomeric_smiles = Chem.MolToSmiles(mol, isomericSmiles=True)
    print(f"Isomeric SMILES: {isomeric_smiles}")
    fp = smiles_to_fingerprint(isomeric_smiles)
    print(f"FP: {fp}")
    aa_features = fasta_to_features(fasta)
    print(f"AA Features: {aa_features}")
    if fp is None or aa_features is None:
        raise ValueError("Invalid input for feature extraction!")
    combined_features = np.hstack((fp, aa_features))
    return model.predict([combined_features])[0]

app = FastAPI()

origins = [
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RequestData(BaseModel):
    drug: str
    protein: str

@app.post("/predict")
async def get_affinity(data: RequestData):
    smiles, fasta = data.drug, data.protein
    
    if df is not None:
        result = df[(df['Drug'].str.lower() == smiles.lower()) & (df['Target'] == fasta)]
        if not result.empty:
            return {"affinity": result.iloc[0]['Y']}
    
    try:
        print("Predicting affinity...")
        prediction = predict_affinity(smiles, fasta)
        return {"predicted_affinity": prediction}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
