# ============================================================
# Heart Disease Prediction – Random Forest + Tuning + Comparison
# Google Colab: upload 'heart.csv' before running
# ============================================================

# Step 0: Import Libraries
# -------------------------
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    classification_report, confusion_matrix,
    roc_curve, auc
)

# Step 1: Load and Explore the Dataset
# ------------------------------------
try:
    df = pd.read_csv('heart.csv')
    print("Dataset loaded successfully!")
    print("\nFirst 5 rows:")
    print(df.head())
    print("\nDataset Info:")
    df.info()
    print("\nTarget distribution (1=Disease, 0=No Disease):")
    print(df['target'].value_counts())
except FileNotFoundError:
    print("Error: 'heart.csv' not found. Please upload it to your Colab environment.")
    exit()

# Step 2: Features and Target
# ---------------------------
X = df.drop('target', axis=1)
y = df['target']

# Step 3: Train-Test Split (80/20)
# --------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# ------------------------------------------------------------------
# Helper: evaluate any trained model and return metrics dict
# ------------------------------------------------------------------
def evaluate_model(name, model, X_tr, y_tr, X_te, y_te, show_details=True):
    """Fit model, print full metrics, return dict with key scores."""
    model.fit(X_tr, y_tr)
    y_pred  = model.predict(X_te)
    y_prob  = model.predict_proba(X_te)[:, 1]

    acc  = accuracy_score(y_te, y_pred)
    prec = precision_score(y_te, y_pred)
    rec  = recall_score(y_te, y_pred)
    fpr, tpr, _ = roc_curve(y_te, y_prob)
    roc_auc_val = auc(fpr, tpr)

    if show_details:
        print(f"\n{'='*50}")
        print(f"  {name}")
        print(f"{'='*50}")
        print(f"Accuracy : {acc:.4f}")
        print(f"Precision: {prec:.4f}")
        print(f"Recall   : {rec:.4f}")
        print(f"AUC      : {roc_auc_val:.4f}")
        print("\nClassification Report:")
        print(classification_report(y_te, y_pred))
        # Confusion matrix
        cm = confusion_matrix(y_te, y_pred)
        plt.figure(figsize=(6, 4))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                    xticklabels=['No Disease', 'Disease'],
                    yticklabels=['No Disease', 'Disease'])
        plt.title(f'Confusion Matrix – {name}')
        plt.xlabel('Predicted'); plt.ylabel('Actual')
        plt.tight_layout(); plt.show()

    return {'name': name, 'acc': acc, 'prec': prec, 'rec': rec,
            'auc': roc_auc_val, 'fpr': fpr, 'tpr': tpr, 'model': model}


# ============================================================
# Steps 4–7: Baseline Random Forest (default params)
# ============================================================
print("\n\n>>> Steps 4–7: Baseline Random Forest (default params)")
res_rf_base = evaluate_model(
    "Baseline Random Forest",
    RandomForestClassifier(n_estimators=100, random_state=42),
    X_train, y_train, X_test, y_test
)
print(f"\nArea Under Curve (AUC): {res_rf_base['auc']:.4f}")


# ============================================================
# Step 8: Hyperparameter Tuning – Random Forest (GridSearchCV)
# ============================================================
print("\n\n>>> Step 8: Random Forest Hyperparameter Tuning")

param_grid = {
    'n_estimators' : [50, 100, 200],
    'max_depth'    : [None, 5, 10],
    'min_samples_split': [2, 5, 10],
}

grid_search = GridSearchCV(
    RandomForestClassifier(random_state=42),
    param_grid,
    cv=5,
    scoring='accuracy',
    n_jobs=-1,
    verbose=1
)
grid_search.fit(X_train, y_train)

print(f"\nBest Parameters : {grid_search.best_params_}")
print(f"Best CV Accuracy: {grid_search.best_score_:.4f}")

# Retrain best RF and evaluate on test set
best_rf = grid_search.best_estimator_
res_rf_tuned = evaluate_model(
    "Tuned Random Forest", best_rf,
    X_train, y_train, X_test, y_test,
    show_details=True
)


# ============================================================
# Step 9: Baseline Model Comparison
# ============================================================
print("\n\n>>> Step 9: Baseline Model Comparison")

# Logistic Regression – wrapped in a Pipeline with StandardScaler
lr_pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('lr', LogisticRegression(max_iter=1000, random_state=42))
])
res_lr = evaluate_model(
    "Logistic Regression", lr_pipeline,
    X_train, y_train, X_test, y_test
)

# Decision Tree
res_dt = evaluate_model(
    "Decision Tree", DecisionTreeClassifier(random_state=42),
    X_train, y_train, X_test, y_test
)


# ============================================================
# Step 10: Comparison Summary Table
# ============================================================
print("\n\n>>> Step 10: Model Comparison Summary")
results = [res_rf_tuned, res_lr, res_dt]

summary = pd.DataFrame([
    {'Model'    : r['name'],
     'Accuracy' : round(r['acc'],  4),
     'Precision': round(r['prec'], 4),
     'Recall'   : round(r['rec'],  4),
     'AUC'      : round(r['auc'],  4)}
    for r in results
])
print("\n" + summary.to_string(index=False))


# ============================================================
# Step 11: Combined ROC Curve (all models on one figure)
# ============================================================
print("\n\n>>> Step 11: Combined ROC Curve")
colors = ['darkorange', 'steelblue', 'forestgreen']

plt.figure(figsize=(8, 6))
for r, color in zip(results, colors):
    plt.plot(r['fpr'], r['tpr'], lw=2, color=color,
             label=f"{r['name']} (AUC = {r['auc']:.2f})")

plt.plot([0, 1], [0, 1], color='gray', lw=2, linestyle='--')
plt.xlim([0.0, 1.0]); plt.ylim([0.0, 1.05])
plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.title('ROC Curve Comparison')
plt.legend(loc="lower right")
plt.tight_layout()
plt.show()

print("\nDone! All steps completed successfully.")
